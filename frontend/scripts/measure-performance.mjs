// Mobile lab measurements; these samples are not field Core Web Vitals.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

const origin = new URL(process.argv[2] ?? 'http://127.0.0.1:4173').origin;
const output = process.argv[3] ?? 'test-results-performance/mobile.json';
const browser = await chromium.launch({ channel: 'chrome' });
const report = {
  measuredAt: new Date().toISOString(),
  origin,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sourceDirty: !!execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
  browser: browser.version(), node: process.version,
  host: { platform: os.platform(), release: os.release(), cpu: os.cpus()[0]?.model },
  conditions: {
    viewport: { width: 390, height: 844 }, dpr: 1, locale: 'en-US',
    cpuSlowdown: 4, latencyMs: 150, downloadBitsPerSecond: 1600000,
    uploadBitsPerSecond: 750000, cacheDisabled: true, repetitions: 3,
    settleMs: 2000, interactionObservationMs: 500,
    controlsMetric: 'Time when the selector is observed visible after the load event; an upper bound, not an exact interactive-ready time.',
    eventMetric: 'Maximum Event Timing duration from one scripted tap; null means no entry at or above 16 ms. This is not INP.',
    note: 'Desktop Chrome mobile emulation; response compression is determined by each origin. Remote sourceCommit identifies the local reference, not the deployed version.',
  },
  samples: [],
};
try {
  for (const path of ['/', '/labs/pendulum', '/labs/day-night']) {
    for (let run = 1; run <= 3; run++) {
      const context = await browser.newContext({
        viewport: report.conditions.viewport, deviceScaleFactor: 1,
        isMobile: true, hasTouch: true, locale: 'en-US', timezoneId: 'Asia/Shanghai',
      });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(60000);
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
        const session = await context.newCDPSession(page);
        await session.send('Network.enable');
        await session.send('Network.setCacheDisabled', { cacheDisabled: true });
        await session.send('Network.emulateNetworkConditions', {
          offline: false, latency: 150,
          downloadThroughput: 1600000 / 8, uploadThroughput: 750000 / 8,
        });
        await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await page.addInitScript(() => {
          const data = window.__labPerf = { lcp: null, lcpElement: null, shifts: [], longTasks: [], events: [] };
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) {
              data.lcp = entry.startTime;
              data.lcpElement = entry.element?.tagName ?? null;
            }
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver(list => {
            for (const entry of list.getEntries())
              if (!entry.hadRecentInput) data.shifts.push({ time: entry.startTime, value: entry.value });
          }).observe({ type: 'layout-shift', buffered: true });
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) data.longTasks.push({ time: entry.startTime, duration: entry.duration });
          }).observe({ type: 'longtask', buffered: true });
          new PerformanceObserver(list => {
            for (const entry of list.getEntries())
              if (entry.interactionId) data.events.push({ name: entry.name, duration: entry.duration });
          }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
        });
        const response = await page.goto(origin + path, { waitUntil: 'load' });
        if (response?.status() !== 200) throw new Error(`HTTP ${response?.status()}`);
        const control = path === '/' ? page.getByRole('searchbox') : page.getByRole('button', { name: 'Play', exact: true });
        await control.waitFor({ state: 'visible' });
        const controlsVisibleMs = await page.evaluate(() => performance.now());
        let sceneReadyMs = null;
        if (path.endsWith('day-night')) {
          await page.locator('canvas').waitFor({ state: 'visible' });
          await page.getByRole('link', { name: 'Surface: NASA Earth Observatory', exact: true }).waitFor({ state: 'visible' });
          sceneReadyMs = await page.evaluate(() => performance.now());
        }
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(2000);
        const loading = await page.evaluate(() => {
          const data = window.__labPerf;
          const nav = performance.getEntriesByType('navigation')[0];
          let cls = 0, windowSum = 0, start = 0, last = 0;
          for (const shift of data.shifts) {
            if (shift.time - last < 1000 && shift.time - start < 5000) windowSum += shift.value;
            else { start = shift.time; windowSum = shift.value; }
            last = shift.time;
            cls = Math.max(cls, windowSum);
          }
          return {
            fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
            lcpMs: data.lcp, lcpElement: data.lcpElement, cls,
            ttfbMs: nav.responseStart, domContentLoadedMs: nav.domContentLoadedEventEnd, loadEventMs: nav.loadEventEnd,
            observedUntilMs: performance.now(),
            longTaskBlockingMs: data.longTasks.reduce((sum, task) => sum + Math.max(0, task.duration - 50), 0),
            resources: performance.getEntriesByType('resource').map(entry => ({
              url: entry.name, responseEndMs: entry.responseEnd, durationMs: entry.duration, transferBytes: entry.transferSize, encodedBytes: entry.encodedBodySize, decodedBytes: entry.decodedBodySize,
            })),
          };
        });
        const start = await page.evaluate(() => performance.now());
        if (path === '/') {
          await page.getByRole('button', { name: 'Mathematics1', exact: true }).tap();
          await page.waitForFunction(() => document.querySelectorAll('a[href^="/labs/"]').length === 1);
        } else {
          await control.tap();
          await page.getByRole('button', { name: 'Pause', exact: true }).waitFor({ state: 'visible' });
        }
        const resultMs = await page.evaluate(() => performance.now()) - start;
        await page.waitForTimeout(500);
        const durations = await page.evaluate(() => window.__labPerf.events.map(event => event.duration));
        const sample = {
          path, run, status: response.status(), controlsVisibleMs, sceneReadyMs,
          ...loading, clickToResultMsIncludingAutomation: resultMs,
          maxObservedEventDurationMs: durations.length ? Math.max(...durations) : null,
          errors,
        };
        report.samples.push(sample);
        console.log(JSON.stringify({ path, run, lcpMs: loading.lcpMs, cls: loading.cls, controlsVisibleMs, sceneReadyMs, eventMs: sample.maxObservedEventDurationMs, errors }));
      } finally { await context.close(); }
    }
  }
} finally {
  await browser.close();
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(`Saved ${report.samples.length} samples to ${output}`);
}

// Browser-side response and animation observations; this is not field INP or a real phone test.
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const browser = await chromium.launch({ channel: 'chrome' });
const origin=process.argv[2] ?? 'http://127.0.0.1:4173';
const report={ sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), sourceDirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(), browser:browser.version(), parameters:[], animation:[], note:'M1 desktop Chrome without throttling; 100 effective Enter commits per case, input capture to readout mutation and the following rendering opportunity (second RAF). This does not measure physical display/GPU completion or field INP. Animation RAF intervals are browser scheduling intervals, not GPU execution times.' };
try {
 for(const [slug,field,values] of [['function-transform','h',['1','2']],['pendulum','length',['2','1']],['day-night','latitude',['5','65']]]) {
  const page=await browser.newPage({viewport:{width:1440,height:900}}); await page.goto(origin+'/labs/'+slug); await page.locator('[data-controls-ready=true]').waitFor();
  if(slug==='day-night')await page.waitForFunction(()=>performance.getEntriesByName('feynman:earth-ready').length>0);
  else await page.locator('svg g').first().waitFor();
  await page.evaluate(field=>{
   const samples=[];window.__responseSamples=samples;let start=null;
   document.getElementById('number-'+field).addEventListener('keydown',event=>{if(event.key==='Enter')start=performance.now();},true);
   const observer=new MutationObserver(()=>{if(start!==null){const began=start;const domMs=performance.now()-began;start=null;requestAnimationFrame(()=>requestAnimationFrame(()=>samples.push({domMs,renderOpportunityMs:performance.now()-began})));}});
   observer.observe(document.querySelector('[aria-label="Formula & readings"]'),{childList:true,subtree:true,characterData:true,attributes:true});
  },field);
  for(let i=0;i<100;i++){
   const input=page.locator('#number-'+field);await input.fill(values[i%2]);await input.press('Enter');
   await page.waitForFunction(n=>window.__responseSamples.length===n,i+1);
  }
  const samples=await page.evaluate(()=>window.__responseSamples);
  const percentile=key=>samples.map(s=>s[key]).sort((a,b)=>a-b)[Math.ceil(samples.length*.95)-1];
  const summary={slug,count:samples.length,p95DomMs:percentile('domMs'),p95RenderOpportunityMs:percentile('renderOpportunityMs')};report.parameters.push({...summary,samples});
  console.log(JSON.stringify(summary));await page.close();
 }
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});await page.goto(origin+'/labs/day-night');await page.waitForFunction(()=>performance.getEntriesByName('feynman:earth-ready').length>0);
  await page.getByRole('button',{name:'Play',exact:true}).click();
  const samples=await page.evaluate(()=>new Promise(resolve=>{const values=[];let previous=performance.now();const until=previous+30000;function tick(now){values.push(now-previous);previous=now;if(now<until)requestAnimationFrame(tick);else resolve(values);}requestAnimationFrame(tick);}));
  const sorted=[...samples].sort((a,b)=>a-b);const data={viewport,dpr:1,durationSeconds:30,frames:samples.length,p95IntervalMs:sorted[Math.ceil(sorted.length*.95)-1],over33Ms:samples.filter(v=>v>33.4).length,samples};report.animation.push(data);console.log(JSON.stringify({...data,samples:undefined}));await page.close();
 }
}finally{await browser.close();await mkdir('test-results-migration-performance',{recursive:true});await writeFile('test-results-migration-performance/interactions.json',JSON.stringify(report,null,2)+'\n');}

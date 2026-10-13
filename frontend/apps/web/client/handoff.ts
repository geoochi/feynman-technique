import type { Snapshot } from "../../../packages/core/types";
import type { Simulation } from "../../../packages/runtime/simulation";
const PREFIX = "feynman:session:";
const PENDING = PREFIX + "pending";
const TTL = 5 * 60 * 1000;
const MAX_BYTES = 16 * 1024;
const NAME_PREFIX = "feynman:handoff:";
interface RecordValue {
  id: string;
  at: number;
  snapshot: Snapshot;
  playing: boolean;
}
interface PendingValue {
  id: string;
  token: string;
  target: string;
  at: number;
  previousName: string;
}
let active:
  | { simulation: Simulation; id: string; navigating: boolean }
  | undefined;
function read(key: string): unknown {
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  if (new TextEncoder().encode(raw).length > MAX_BYTES) {
    sessionStorage.removeItem(key);
    return null;
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(key);
    return null;
  }
  if (
    !value ||
    typeof value.at !== "number" ||
    value.at > Date.now() ||
    Date.now() - value.at > TTL
  ) {
    if (key === PENDING && window.name === NAME_PREFIX + value?.token)
      window.name =
        typeof value.previousName === "string" ? value.previousName : "";
    sessionStorage.removeItem(key);
    return null;
  }
  return value;
}
function write(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  if (new TextEncoder().encode(raw).length > MAX_BYTES)
    throw new Error("Session too large");
  sessionStorage.setItem(key, raw);
  if (sessionStorage.getItem(key) !== raw)
    throw new Error("Session storage unavailable");
}
function stamp(id: string) {
  history.replaceState({ ...history.state, feynmanSession: id }, "");
}
function save(current: NonNullable<typeof active>) {
  write(PREFIX + current.id, {
    id: current.id,
    at: Date.now(),
    snapshot: current.simulation.snapshot(),
    playing: current.simulation.playing,
  } satisfies RecordValue);
}
function restore(simulation: Simulation, id: string) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("Invalid session id");
  const value = read(PREFIX + id) as RecordValue | null;
  if (!value || value.id !== id || typeof value.playing !== "boolean")
    throw new Error("Session expired");
  simulation.restore(value.snapshot);
  if (value.playing) simulation.toggle();
}
export function attachSession(
  simulation: Simulation,
  reportFailure: () => void,
  setReady: (ready: boolean) => void,
) {
  let id = crypto.randomUUID();
  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  const expectsRestore =
    window.name.startsWith(NAME_PREFIX) ||
    (navigation?.type === "back_forward" && !!history.state?.feynmanSession);
  try {
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith(PREFIX)) read(key);
    const pending = read(PENDING) as PendingValue | null;
    const currentUrl = location.pathname + location.search + location.hash;
    const nameToken = window.name.startsWith(NAME_PREFIX)
      ? window.name.slice(NAME_PREFIX.length)
      : null;
    // A token belongs to a single navigation in this tab. Refresh/direct access never consume history state.
    if (
      pending &&
      nameToken === pending.token &&
      pending.target === currentUrl
    ) {
      sessionStorage.removeItem(PENDING);
      window.name = pending.previousName;
      if (Date.now() - pending.at >= 30000) throw new Error("Handoff expired");
      restore(simulation, pending.id);
      id = pending.id;
    } else {
      const nav = performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (nav?.type !== "reload" && history.state?.feynmanSession) {
        const previous = read(
          PREFIX + history.state.feynmanSession,
        ) as RecordValue | null;
        if (previous?.snapshot?.labId === simulation.lab.id) {
          restore(simulation, history.state.feynmanSession);
          id = history.state.feynmanSession;
        } else if (nav?.type === "back_forward")
          throw new Error("Session unavailable");
      }
      if (pending) {
        sessionStorage.removeItem(PENDING);
        if (nameToken) window.name = pending.previousName;
      }
    }
    stamp(id);
  } catch {
    if (expectsRestore) reportFailure();
  }
  const current = { simulation, id, navigating: false };
  active = current;
  const hide = () => {
    if (!current.navigating)
      try {
        save(current);
      } catch {
        /* Restoration reports storage failure on return. */
      }
  };
  let resumeTimer: ReturnType<typeof setTimeout> | undefined;
  const show = (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    setReady(false);
    // Chromium refreshes a BFCache document's Storage view after pageshow dispatch.
    // Restore in the next task, after that refresh, before enabling controls.
    resumeTimer = setTimeout(() => {
      try {
        restore(simulation, current.id);
        current.navigating = false;
        active = current;
        setReady(true);
      } catch {
        reportFailure();
      }
    }, 0);
  };
  window.addEventListener("pagehide", hide);
  window.addEventListener("pageshow", show);
  return () => {
    clearTimeout(resumeTimer);
    hide();
    if (active === current) active = undefined;
    window.removeEventListener("pagehide", hide);
    window.removeEventListener("pageshow", show);
  };
}
export async function navigateLanguage(target: string) {
  const current = active;
  if (!current) {
    location.assign(target);
    return;
  }
  if (current.navigating) return;
  // Fail before modifying playback or leaving the page if the destination cannot be fetched.
  const response = await fetch(target, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (
    !response.ok ||
    !response.headers.get("content-type")?.includes("text/html")
  )
    throw new Error("Navigation unavailable");
  await response.text();
  const token = crypto.randomUUID();
  const previousName = window.name;
  save(current);
  write(PENDING, {
    id: current.id,
    token,
    target,
    at: Date.now(),
    previousName,
  } satisfies PendingValue);
  window.name = NAME_PREFIX + token;
  current.navigating = true;
  if (current.simulation.playing) current.simulation.toggle();
  location.assign(target);
}

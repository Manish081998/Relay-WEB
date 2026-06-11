export interface PlannerReleaseMeta {
  plant: string;
  ts:    string;
}

// In-memory + sessionStorage state that survives page navigation within the
// current browser tab but resets on tab close — intentionally lighter than
// localStorage so stale draft assignments don't accumulate across sessions.
export interface PlannerSessionState {
  overrides:   Record<string, string>;
  notes:       Record<string, string>;
  released:    Record<string, boolean>;
  releaseMeta: Record<string, PlannerReleaseMeta>;
  selections:  Record<string, boolean>;
}

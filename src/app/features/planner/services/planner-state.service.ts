import { Injectable } from '@angular/core';
import { PlannerSessionState } from '../models/planner-session.model';

// Uses sessionStorage (not localStorage) so draft assignments reset when the
// browser tab is closed — prevents stale plant overrides carrying over across
// planning sessions.
const SESSION_STORAGE_KEY = 'relay-planner-state-v1';

const emptyState = (): PlannerSessionState => ({
  overrides:   {},
  notes:       {},
  released:    {},
  releaseMeta: {},
  selections:  {},
});

@Injectable()
export class PlannerStateService {

  getState(): PlannerSessionState {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw) as Partial<PlannerSessionState>;
      return {
        overrides:   parsed.overrides   ?? {},
        notes:       parsed.notes       ?? {},
        released:    parsed.released    ?? {},
        releaseMeta: parsed.releaseMeta ?? {},
        selections:  parsed.selections  ?? {},
      };
    } catch {
      return emptyState();
    }
  }

  saveState(state: PlannerSessionState): void {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // sessionStorage quota exceeded or unavailable — draft changes not persisted this write.
    }
  }

  patch(partial: Partial<PlannerSessionState>): PlannerSessionState {
    const next = { ...this.getState(), ...partial };
    this.saveState(next);
    return next;
  }

  clear(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  hasPersistedChanges(): boolean {
    const s = this.getState();
    return (
      Object.keys(s.overrides).length > 0 ||
      Object.keys(s.released).length > 0 ||
      Object.values(s.notes).some(n => !!n)
    );
  }
}

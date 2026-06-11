import { CapacityStatus } from '../models/planner-plant.model';

// warn at ≥ 70 %, over at ≥ 90 %
export function capacityStatus(load: number, capacity: number): CapacityStatus {
  const pct = load / capacity;
  if (pct >= 0.9) return 'over';
  if (pct >= 0.7) return 'warn';
  return 'ok';
}

// Returns a calendar month key in the format "YYYY-MM" (e.g. "2025-06").
export function yearMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Returns a human-readable month label like "Jun 2025".
export function monthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function calculateDeltaDifference(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : Infinity;
  }
  return Number((((current - previous) / previous) * 100).toFixed(0));
}

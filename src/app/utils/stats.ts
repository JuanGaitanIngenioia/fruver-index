export function sum(nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}

export function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return sum(nums) / nums.length;
}

export function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0;
  const mean = average(nums);
  const variance = nums.reduce((acc, n) => acc + (n - mean) ** 2, 0) / (nums.length - 1);
  return Math.sqrt(variance);
}

export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current / previous) - 1) * 100;
}

export function formatYearMonth(dateIso: string): string {
  // dateIso: YYYY-MM-DD
  return dateIso.slice(0, 7);
}


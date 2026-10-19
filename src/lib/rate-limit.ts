/**
 * A sliding-window limiter, per key, in memory.
 *
 * In memory is a stated limitation, not an oversight: it resets on a deploy and
 * each serverless instance counts for itself, so it stops one script hammering
 * one instance and is no defence against a distributed flood. A shared store
 * (Redis, the platform's firewall rules) is the real answer and replaces this
 * function without touching its callers. Until then the order route also checks
 * the database for how many orders one customer made recently, which *is*
 * shared across instances.
 */
const buckets = new Map<string, number[]>()

export function rateLimited(key: string, { windowMs, max }: { windowMs: number; max: number }): boolean {
  const now = Date.now()
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  recent.push(now)
  buckets.set(key, recent)

  // Crude bound on memory: forgetting everyone briefly is better than growing
  // without limit under a flood of distinct keys.
  if (buckets.size > 5000) buckets.clear()
  return recent.length > max
}

/** The address the request came from, as the platform reports it. */
export function clientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

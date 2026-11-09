export interface SessionTimes {
  readonly startedAt: Date
  readonly endedAt: Date | null
}

export function sessionDurationMs(session: SessionTimes, now: Date): number {
  const end = session.endedAt ?? now
  const duration = end.getTime() - session.startedAt.getTime()

  return Number.isFinite(duration) ? Math.max(0, duration) : 0
}

const UNITS = [
  {
    label: "h",
    seconds: 3600,
  },
  {
    label: "m",
    seconds: 60,
  },
  {
    label: "s",
    seconds: 1,
  },
] as const

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 1000) {
    return "0 s"
  }

  let remaining = Math.floor(ms / 1000)
  const parts: Array<{ label: string; value: number }> = []

  for (const unit of UNITS) {
    const value = Math.floor(remaining / unit.seconds)
    remaining %= unit.seconds

    if (value > 0 || parts.length > 0) {
      parts.push({ label: unit.label, value })
    }
  }

  return (
    parts
      .slice(0, 2)
      .map(({ label, value }) => `${value} ${label}`)
      .join(" ") || "0 s"
  )
}

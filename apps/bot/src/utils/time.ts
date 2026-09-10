type TimeUnit = "hours" | "minutes" | "seconds"

export function formatTime(
  seconds: number,
  format: TimeUnit[] = ["hours", "minutes", "seconds"]
): string {
  let remainingSeconds = Math.max(0, Math.floor(seconds))
  let hasStarted = false
  const parts: string[] = []

  if (format.includes("hours")) {
    const h = Math.floor(remainingSeconds / 3600)

    if (h > 0 || hasStarted) {
      parts.push(`${h} h`)
      hasStarted = true
    }

    remainingSeconds %= 3600
  }

  if (format.includes("minutes")) {
    const m = Math.floor(remainingSeconds / 60)

    if (m > 0 || hasStarted) {
      parts.push(`${m} m`)
      hasStarted = true
    }

    remainingSeconds %= 60
  }

  if (format.includes("seconds")) {
    const s = remainingSeconds

    if (s > 0 || hasStarted) {
      parts.push(`${s} s`)
      hasStarted = true
    }
  }

  return parts.length > 0 ? parts.join(" ") : "0 s"
}

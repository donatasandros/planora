import { describe, expect, it } from "vitest"
import { formatDuration, sessionDurationMs } from "./duration"

describe("sessionDurationMs", () => {
  it("uses now for an open session", () => {
    const startedAt = new Date("2026-01-01T10:00:00Z")
    const now = new Date("2026-01-01T10:30:00Z")

    expect(sessionDurationMs({ startedAt, endedAt: null }, now)).toBe(1_800_000)
  })

  it("uses endedAt for a closed session", () => {
    const startedAt = new Date("2026-01-01T10:00:00Z")
    const endedAt = new Date("2026-01-01T10:30:00Z")
    const now = new Date("2026-01-01T11:00:00Z")

    expect(sessionDurationMs({ startedAt, endedAt }, now)).toBe(1_800_000)
  })

  it("clamps when the end is before the start", () => {
    const startedAt = new Date("2026-01-01T10:00:00Z")
    const endedAt = new Date("2026-01-01T09:00:00Z")

    expect(sessionDurationMs({ startedAt, endedAt }, new Date())).toBe(0)
  })

  it("clamps when now is before the start", () => {
    const startedAt = new Date("2026-01-01T10:00:00Z")
    const now = new Date("2026-01-01T09:00:00Z")

    expect(sessionDurationMs({ startedAt, endedAt: null }, now)).toBe(0)
  })
})

describe("formatDuration", () => {
  it("formats zero", () => {
    expect(formatDuration(0)).toBe("0 s")
  })

  it("floors partial seconds", () => {
    expect(formatDuration(999)).toBe("0 s")
    expect(formatDuration(1_000)).toBe("1 s")
  })

  it("formats seconds only", () => {
    expect(formatDuration(59_999)).toBe("59 s")
  })

  it("formats minutes and seconds", () => {
    expect(formatDuration(60_000)).toBe("1 m 0 s")
    expect(formatDuration(61_000)).toBe("1 m 1 s")
    expect(formatDuration(90_000)).toBe("1 m 30 s")
  })

  it("formats hours and minutes", () => {
    expect(formatDuration(3_600_000)).toBe("1 h 0 m")
    expect(formatDuration(3_601_000)).toBe("1 h 0 m")
    expect(formatDuration(3_661_000)).toBe("1 h 1 m")
  })

  it("keeps the two largest units", () => {
    expect(formatDuration(3_599_000)).toBe("59 m 59 s")
    expect(formatDuration(86_400_000)).toBe("24 h 0 m")
  })

  it("floors before choosing units", () => {
    expect(formatDuration(3_600_999)).toBe("1 h 0 m")
  })

  it("clamps negative input", () => {
    expect(formatDuration(-1)).toBe("0 s")
  })

  it("returns zero for non-finite input", () => {
    expect(formatDuration(Number.NaN)).toBe("0 s")
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe("0 s")
    expect(formatDuration(Number.NEGATIVE_INFINITY)).toBe("0 s")
  })
})

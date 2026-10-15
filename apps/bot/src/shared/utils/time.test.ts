import { describe, expect, it } from "vitest"
import { formatTime } from "@/shared/utils/time"

describe("formatTime", () => {
	it("renders zero as '0 s'", () => {
		expect(formatTime(0)).toBe("0 s")
	})

	it("renders a full h/m/s breakdown", () => {
		expect(formatTime(3661)).toBe("1 h 1 m 1 s")
	})

	it("omits leading zero units", () => {
		expect(formatTime(65)).toBe("1 m 5 s")
		expect(formatTime(59)).toBe("59 s")
	})

	it("keeps trailing zero units after the first non-zero unit", () => {
		expect(formatTime(3600)).toBe("1 h 0 m 0 s")
		expect(formatTime(60)).toBe("1 m 0 s")
	})

	it("clamps negatives to zero", () => {
		expect(formatTime(-5)).toBe("0 s")
	})

	it("floors fractional seconds", () => {
		expect(formatTime(59.9)).toBe("59 s")
	})

	it("honours a unit subset", () => {
		expect(formatTime(3661, ["hours"])).toBe("1 h")
		expect(formatTime(90, ["seconds"])).toBe("90 s")
	})

	it("treats units as a set, independent of order and duplicates", () => {
		expect(formatTime(3661, ["minutes", "hours"])).toBe("1 h 1 m")
		expect(formatTime(3661, ["hours", "minutes"])).toBe("1 h 1 m")
		expect(formatTime(60, ["hours", "hours", "minutes"])).toBe("1 m")
	})

	it("re-chains the remainder when a larger unit is omitted", () => {
		expect(formatTime(3661, ["minutes"])).toBe("61 m")
		expect(formatTime(3661, ["minutes", "minutes"])).toBe("61 m")
	})

	it("falls back to '0 s' for an empty unit list", () => {
		expect(formatTime(100, [])).toBe("0 s")
	})
})

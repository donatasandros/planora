import { describe, expect, it } from "vitest"
import { formatActivityRow } from "@/features/activity/reporting/formatting"

describe("formatActivityRow", () => {
	it("renders the name literally inside the code span", () => {
		expect(formatActivityRow("a_b")).toBe("**•** `a_b` - now")
	})

	it("replaces a backtick that would close the code span", () => {
		expect(formatActivityRow("a`b")).toBe("**•** `a'b` - now")
	})

	it("renders a duration when provided", () => {
		expect(formatActivityRow("Game", { durationSeconds: 65 })).toBe(
			"**•** `Game` - 1 m 5 s - now"
		)
	})

	it("omits a zero duration", () => {
		expect(formatActivityRow("Game", { durationSeconds: 0 })).toBe(
			"**•** `Game` - now"
		)
	})

	it("renders a discord timestamp when provided", () => {
		expect(formatActivityRow("Game", { timestamp: 1700000000 })).toBe(
			"**•** `Game` - <t:1700000000:R>"
		)
	})
})

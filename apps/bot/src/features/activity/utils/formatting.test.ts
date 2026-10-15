import { describe, expect, it } from "vitest"
import {
	escapeMarkdown,
	formatActivityRow,
} from "@/features/activity/utils/formatting"

describe("escapeMarkdown", () => {
	it("escapes backslashes, backticks, asterisks and underscores", () => {
		expect(escapeMarkdown("a*b_c`d\\e")).toBe("a\\*b\\_c\\`d\\\\e")
	})

	it("leaves plain text untouched", () => {
		expect(escapeMarkdown("Plain text")).toBe("Plain text")
	})
})

describe("formatActivityRow", () => {
	it("escapes the name and marks an unknown date without a timestamp", () => {
		expect(formatActivityRow("a_b")).toBe("**•** `a\\_b`  - Unknown")
	})

	it("renders a duration when provided", () => {
		expect(formatActivityRow("Game", { durationSeconds: 65 })).toBe(
			"**•** `Game` - 1 m 5 s - Unknown"
		)
	})

	it("omits a zero duration", () => {
		expect(formatActivityRow("Game", { durationSeconds: 0 })).toBe(
			"**•** `Game`  - Unknown"
		)
	})

	it("renders a discord timestamp when provided", () => {
		expect(formatActivityRow("Game", { timestamp: 1700000000 })).toBe(
			"**•** `Game`  - <t:1700000000:R>"
		)
	})
})

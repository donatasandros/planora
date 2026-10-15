import { describe, expect, it } from "vitest"
import { discordTimestamp } from "@/shared/utils/discord"

describe("discordTimestamp", () => {
	it("defaults to the relative style", () => {
		expect(discordTimestamp(1700000000)).toBe("<t:1700000000:R>")
	})

	it("accepts an explicit style", () => {
		expect(discordTimestamp(1700000000, "F")).toBe("<t:1700000000:F>")
	})
})

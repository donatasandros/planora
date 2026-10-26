import { describe, expect, it, vi } from "vitest"
import { getCooldownKey, isOnCooldown } from "@/core/commands/cooldown"

describe("getCooldownKey", () => {
	it("namespaces by command and user", () => {
		expect(getCooldownKey("activity", "42")).toBe("bot:cmd:activity:42")
	})
})

describe("isOnCooldown", () => {
	it("does not claim when the cooldown is disabled", async () => {
		const claim = vi.fn().mockResolvedValue(true)

		const blocked = await isOnCooldown({
			commandName: "activity",
			userId: "42",
			cooldownSeconds: 0,
			claim,
		})

		expect(blocked).toBe(false)
		expect(claim).not.toHaveBeenCalled()
	})

	it("allows the interaction that wins the claim", async () => {
		const claim = vi.fn().mockResolvedValue(true)

		const blocked = await isOnCooldown({
			commandName: "activity",
			userId: "42",
			cooldownSeconds: 5,
			claim,
		})

		expect(blocked).toBe(false)
		expect(claim).toHaveBeenCalledWith("bot:cmd:activity:42", 5)
	})

	it("blocks an interaction that loses the claim", async () => {
		const claim = vi.fn().mockResolvedValue(false)

		const blocked = await isOnCooldown({
			commandName: "activity",
			userId: "42",
			cooldownSeconds: 5,
			claim,
		})

		expect(blocked).toBe(true)
	})

	it("keys each command and user separately", async () => {
		const claim = vi.fn().mockResolvedValue(true)

		await isOnCooldown({
			commandName: "history",
			userId: "7",
			cooldownSeconds: 5,
			claim,
		})

		expect(claim).toHaveBeenCalledWith("bot:cmd:history:7", 5)
	})
})

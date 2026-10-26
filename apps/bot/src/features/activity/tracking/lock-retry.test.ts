import { describe, expect, it, vi } from "vitest"
import { acquireLockWithRetry } from "@/features/activity/tracking/lock-retry"

function createSleep() {
	return vi.fn(async () => {})
}

describe("acquireLockWithRetry", () => {
	it("returns the first token without sleeping", async () => {
		const acquire = vi.fn().mockResolvedValue("token-1")
		const sleep = createSleep()

		const token = await acquireLockWithRetry({
			acquire,
			attempts: 3,
			delayMs: 200,
			sleep,
		})

		expect(token).toBe("token-1")
		expect(acquire).toHaveBeenCalledTimes(1)
		expect(sleep).not.toHaveBeenCalled()
	})

	it("retries until a token is available", async () => {
		const acquire = vi
			.fn()
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce(null)
			.mockResolvedValueOnce("token-3")
		const sleep = createSleep()

		const token = await acquireLockWithRetry({
			acquire,
			attempts: 3,
			delayMs: 200,
			sleep,
		})

		expect(token).toBe("token-3")
		expect(acquire).toHaveBeenCalledTimes(3)
		expect(sleep).toHaveBeenCalledTimes(2)
		expect(sleep).toHaveBeenCalledWith(200)
	})

	it("gives up after the last attempt without a trailing sleep", async () => {
		const acquire = vi.fn().mockResolvedValue(null)
		const sleep = createSleep()

		const token = await acquireLockWithRetry({
			acquire,
			attempts: 3,
			delayMs: 200,
			sleep,
		})

		expect(token).toBeNull()
		expect(acquire).toHaveBeenCalledTimes(3)
		expect(sleep).toHaveBeenCalledTimes(2)
	})

	it("propagates an acquire failure", async () => {
		const acquire = vi.fn().mockRejectedValue(new Error("redis down"))

		await expect(
			acquireLockWithRetry({
				acquire,
				attempts: 3,
				delayMs: 200,
				sleep: createSleep(),
			})
		).rejects.toThrow("redis down")
	})
})

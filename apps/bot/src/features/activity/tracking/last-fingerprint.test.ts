import { describe, expect, it, vi } from "vitest"
import {
	createLastFingerprintStore,
	isDuplicatePresence,
	LAST_FINGERPRINT_TTL_SECONDS,
} from "@/features/activity/tracking/last-fingerprint"

function createStore() {
	const data = new Map<string, unknown>()

	async function get<T>(key: string): Promise<T | null> {
		return (data.get(key) ?? null) as T | null
	}

	const set = vi.fn(async (key: string, value: unknown) => {
		data.set(key, value)
	})

	return { store: createLastFingerprintStore({ get, set }), set }
}

describe("createLastFingerprintStore", () => {
	it("returns null when nothing has been processed", async () => {
		const { store } = createStore()

		await expect(store.read("42")).resolves.toBeNull()
	})

	it("round-trips the committed hash", async () => {
		const { store } = createStore()

		await store.commit("42", "hash-a")

		await expect(store.read("42")).resolves.toBe("hash-a")
	})

	it("writes the per-user key with the collection ttl", async () => {
		const { store, set } = createStore()

		await store.commit("42", "hash-a")

		expect(set).toHaveBeenCalledWith(
			"activity:user:42:fingerprint",
			{ hash: "hash-a" },
			LAST_FINGERPRINT_TTL_SECONDS
		)
	})

	it("treats a corrupt entry as unprocessed", async () => {
		const data = new Map<string, unknown>([
			["activity:user:42:fingerprint", { nope: true }],
		])
		const store = createLastFingerprintStore({
			get: async <T>(key: string) => (data.get(key) ?? null) as T | null,
			set: async () => {},
		})

		await expect(store.read("42")).resolves.toBeNull()
	})

	it("does not share state between users", async () => {
		const { store } = createStore()

		await store.commit("42", "hash-a")

		await expect(store.read("43")).resolves.toBeNull()
	})
})

describe("isDuplicatePresence", () => {
	it("skips only an identical consecutive state", () => {
		expect(isDuplicatePresence("hash-a", "hash-a")).toBe(true)
		expect(isDuplicatePresence("hash-b", "hash-a")).toBe(false)
		expect(isDuplicatePresence(null, "hash-a")).toBe(false)
	})

	it("processes a stop and a restart of the same activity", async () => {
		const { store } = createStore()
		const states = ["hash-a", "hash-b", "hash-a"]
		const processed: string[] = []

		for (const hash of states) {
			const last = await store.read("42")

			if (isDuplicatePresence(last, hash)) {
				continue
			}

			processed.push(hash)
			await store.commit("42", hash)
		}

		expect(processed).toEqual(states)
	})
})

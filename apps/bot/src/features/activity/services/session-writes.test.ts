import { describe, expect, it, vi } from "vitest"
import { createSessionWriteSink } from "@/features/activity/services/session-writes"
import type { SessionStartRow } from "@/features/activity/types"

vi.mock("@workspace/db", () => ({
	db: {},
	activitySessionsTable: {},
	activityTotalsTable: {},
	sql: vi.fn(),
}))

vi.mock("@/core/logger", () => ({
	logger: {
		debug: vi.fn(),
		error: vi.fn(),
		fatal: vi.fn(),
		info: vi.fn(),
		trace: vi.fn(),
		warn: vi.fn(),
	},
}))

function startRow(id: string): SessionStartRow {
	return { id } as SessionStartRow
}

function createClock() {
	let tick: (() => void) | undefined

	return {
		clock: {
			setInterval: vi.fn((callback: () => void) => {
				tick = callback

				return 1 as unknown as ReturnType<typeof setInterval>
			}),
			clearInterval: vi.fn(),
		},
		tick: () => tick?.(),
	}
}

describe("createSessionWriteSink", () => {
	it("flushes queued starts and finishes together", async () => {
		const insertSessionRows = vi.fn(async () => new Set(["start-1"]))
		const rollupSessionFinishes = vi.fn(async () => {})
		const sink = createSessionWriteSink({
			insertSessionRows,
			rollupSessionFinishes,
		})

		const started = sink.enqueueStart(startRow("start-1"))
		const finished = sink.enqueueFinish("finish-1", 100, 60)

		expect(insertSessionRows).not.toHaveBeenCalled()
		expect(rollupSessionFinishes).not.toHaveBeenCalled()

		await sink.flush()

		await expect(started).resolves.toBe(true)
		await expect(finished).resolves.toBeUndefined()
		expect(insertSessionRows).toHaveBeenCalledWith([{ id: "start-1" }])
		expect(rollupSessionFinishes).toHaveBeenCalledWith([
			{
				kind: "finish",
				id: "finish-1",
				endedAt: 100,
				durationSeconds: 60,
				resolve: expect.any(Function),
				reject: expect.any(Function),
			},
		])
	})

	it("resolves false when the start conflicts", async () => {
		const sink = createSessionWriteSink({
			insertSessionRows: async () => new Set(),
			rollupSessionFinishes: async () => {},
		})

		const started = sink.enqueueStart(startRow("duplicate"))

		await sink.flush()

		await expect(started).resolves.toBe(false)
	})

	it("flushes automatically when the batch limit is reached", async () => {
		const insertSessionRows = vi.fn(async (rows: SessionStartRow[]) => {
			return new Set(rows.map((row) => row.id))
		})
		const sink = createSessionWriteSink({
			insertSessionRows,
			rollupSessionFinishes: async () => {},
		})

		const starts = Array.from({ length: 200 }, (_, index) =>
			sink.enqueueStart(startRow(`start-${index}`))
		)

		await expect(Promise.all(starts)).resolves.toEqual(
			Array.from({ length: 200 }, () => true)
		)
		expect(insertSessionRows).toHaveBeenCalledOnce()
	})

	it("falls back to individual writes when a start batch fails", async () => {
		const insertSessionRows = vi
			.fn(
				async (rows: SessionStartRow[]) =>
					new Set(rows.map((row) => row.id))
			)
			.mockRejectedValueOnce(new Error("batch failed"))
		const sink = createSessionWriteSink({
			insertSessionRows,
			rollupSessionFinishes: async () => {},
		})

		const starts = [
			sink.enqueueStart(startRow("start-1")),
			sink.enqueueStart(startRow("start-2")),
		]

		await sink.flush()

		await expect(Promise.all(starts)).resolves.toEqual([true, true])
		expect(insertSessionRows).toHaveBeenCalledTimes(3)
	})

	it("falls back to individual writes when a finish batch fails", async () => {
		const rollupSessionFinishes = vi
			.fn(async () => {})
			.mockRejectedValueOnce(new Error("batch failed"))
		const sink = createSessionWriteSink({
			insertSessionRows: async () => new Set(),
			rollupSessionFinishes,
		})

		const finishes = [
			sink.enqueueFinish("finish-1", 100, 60),
			sink.enqueueFinish("finish-2", 200, 30),
		]

		await sink.flush()

		await expect(Promise.all(finishes)).resolves.toEqual([
			undefined,
			undefined,
		])
		expect(rollupSessionFinishes).toHaveBeenCalledTimes(3)
	})

	it("rejects only the operation that fails during fallback", async () => {
		const insertSessionRows = vi
			.fn(
				async (rows: SessionStartRow[]) =>
					new Set(rows.map((row) => row.id))
			)
			.mockRejectedValueOnce(new Error("batch failed"))
			.mockResolvedValueOnce(new Set(["start-1"]))
			.mockRejectedValueOnce(new Error("start-2 failed"))
		const sink = createSessionWriteSink({
			insertSessionRows,
			rollupSessionFinishes: async () => {},
		})

		const first = sink.enqueueStart(startRow("start-1"))
		const second = sink.enqueueStart(startRow("start-2"))

		await sink.flush()

		await expect(first).resolves.toBe(true)
		await expect(second).rejects.toThrow("start-2 failed")
	})

	it("flushes on stop and clears the timer", async () => {
		const { clock, tick } = createClock()
		const insertSessionRows = vi.fn(
			async (rows: SessionStartRow[]) => new Set(rows.map((row) => row.id))
		)
		const sink = createSessionWriteSink({
			insertSessionRows,
			rollupSessionFinishes: async () => {},
			clock,
		})

		const started = sink.enqueueStart(startRow("start-1"))

		tick()
		await expect(started).resolves.toBe(true)
		expect(insertSessionRows).toHaveBeenCalledOnce()

		const second = sink.enqueueStart(startRow("start-2"))

		await sink.stop()

		await expect(second).resolves.toBe(true)
		expect(clock.clearInterval).toHaveBeenCalledOnce()
		expect(insertSessionRows).toHaveBeenCalledTimes(2)
	})

	it("waits for the in-flight flush on stop", async () => {
		let release!: () => void
		const gate = new Promise<void>((resolve) => {
			release = resolve
		})
		const insertSessionRows = vi.fn(async (rows: SessionStartRow[]) => {
			await gate
			return new Set(rows.map((row) => row.id))
		})
		const sink = createSessionWriteSink({
			insertSessionRows,
			rollupSessionFinishes: async () => {},
		})

		const started = sink.enqueueStart(startRow("start-1"))
		void sink.flush()

		let stopped = false
		const stopPromise = sink.stop().then(() => {
			stopped = true
		})

		await Promise.resolve()
		expect(stopped).toBe(false)

		release()
		await stopPromise
		await expect(started).resolves.toBe(true)
	})
})

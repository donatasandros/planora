import {
	activitySessionsTable,
	activityTotalsTable,
	db,
	sql,
} from "@workspace/db"
import { logger } from "@/core/logger"
import type {
	FinishOperation,
	PendingOperation,
	SessionStartRow,
	StartOperation,
} from "@/features/activity/types"

const SESSION_WRITE_FLUSH_INTERVAL_MS = 3 * 1000 // 3 seconds
const SESSION_WRITE_MAX_BATCH_OPS = 200

const SYSTEM_CLOCK: SessionWriteClock = {
	setInterval: (callback, ms) => globalThis.setInterval(callback, ms),
	clearInterval: (handle) => globalThis.clearInterval(handle),
}

export type SessionWriteClock = {
	setInterval: (
		callback: () => void,
		ms: number
	) => ReturnType<typeof setInterval>
	clearInterval: (handle: ReturnType<typeof setInterval>) => void
}

export type SessionWriteSinkOptions = {
	insertSessionRows: (rows: SessionStartRow[]) => Promise<Set<string>>
	rollupSessionFinishes: (ops: FinishOperation[]) => Promise<void>
	clock?: SessionWriteClock
}

export type SessionWriteSink = {
	enqueueStart: (row: SessionStartRow) => Promise<boolean>
	enqueueFinish: (
		id: string,
		endedAt: number,
		durationSeconds: number
	) => Promise<void>
	flush: () => Promise<void>
	stop: () => Promise<void>
}

export function createSessionWriteSink({
	insertSessionRows,
	rollupSessionFinishes,
	clock = SYSTEM_CLOCK,
}: SessionWriteSinkOptions): SessionWriteSink {
	const buffer: PendingOperation[] = []
	let timer: ReturnType<typeof setInterval> | undefined
	let flushing = false

	function ensureTimer(): void {
		if (timer) {
			return
		}

		timer = clock.setInterval(() => {
			void flushInternal()
		}, SESSION_WRITE_FLUSH_INTERVAL_MS)

		const handle = timer as NodeJS.Timeout
		handle.unref?.()
	}

	async function flushSingle(op: PendingOperation): Promise<void> {
		if (op.kind === "start") {
			const insertedIds = await insertSessionRows([op.row])

			op.resolve(insertedIds.has(op.row.id))

			return
		}

		await rollupSessionFinishes([op])

		op.resolve()
	}

	async function flushBatch(batch: PendingOperation[]): Promise<void> {
		const starts = batch.filter(
			(op): op is StartOperation => op.kind === "start"
		)
		const finishes = batch.filter(
			(op): op is FinishOperation => op.kind === "finish"
		)

		try {
			if (starts.length > 0) {
				const insertedIds = await insertSessionRows(
					starts.map((op) => op.row)
				)

				for (const op of starts) {
					op.resolve(insertedIds.has(op.row.id))
				}
			}

			if (finishes.length > 0) {
				await rollupSessionFinishes(finishes)

				for (const op of finishes) {
					op.resolve()
				}
			}

			return
		} catch (err) {
			logger.warn(
				{ err, batchSize: batch.length },
				"Batched session write failed, retrying rows individually"
			)
		}

		for (const op of batch) {
			try {
				await flushSingle(op)
			} catch (err) {
				op.reject(err)
			}
		}
	}

	async function flushInternal(): Promise<void> {
		if (flushing || buffer.length === 0) {
			return
		}

		flushing = true

		try {
			while (buffer.length > 0) {
				const batch = buffer.splice(0, SESSION_WRITE_MAX_BATCH_OPS)

				try {
					await flushBatch(batch)
				} catch (err) {
					logger.error({ err }, "Session write batch failed unexpectedly")

					for (const op of batch) {
						op.reject(err)
					}
				}
			}
		} finally {
			flushing = false
		}
	}

	async function stop(): Promise<void> {
		if (timer) {
			clock.clearInterval(timer)
			timer = undefined
		}

		await flushInternal()
	}

	function enqueueStart(row: SessionStartRow): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			buffer.push({ kind: "start", row, resolve, reject })
			ensureTimer()

			if (buffer.length >= SESSION_WRITE_MAX_BATCH_OPS) {
				void flushInternal()
			}
		})
	}

	async function enqueueFinish(
		id: string,
		endedAt: number,
		durationSeconds: number
	): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			buffer.push({
				kind: "finish",
				id,
				endedAt,
				durationSeconds,
				resolve,
				reject,
			})
			ensureTimer()

			if (buffer.length >= SESSION_WRITE_MAX_BATCH_OPS) {
				void flushInternal()
			}
		})
	}

	return {
		enqueueStart,
		enqueueFinish,
		flush: flushInternal,
		stop,
	}
}

async function insertSessionRows(
	rows: SessionStartRow[]
): Promise<Set<string>> {
	const created = await db
		.insert(activitySessionsTable)
		.values(rows)
		.onConflictDoNothing()
		.returning({ id: activitySessionsTable.id })

	return new Set(created.map((row) => row.id))
}

async function rollupSessionFinishes(ops: FinishOperation[]): Promise<void> {
	const assignments = ops.map(
		(op) =>
			sql`(${op.id}, ${op.endedAt}::bigint, ${op.durationSeconds}::integer)`
	)

	await db.execute(sql`
		WITH updated AS (
			UPDATE ${activitySessionsTable} AS s
			SET ended_at = v.ended_at, duration_seconds = v.duration_seconds
			FROM (VALUES ${sql.join(assignments, sql`, `)}) AS v(id, ended_at, duration_seconds)
			WHERE s.id = v.id AND s.ended_at IS NULL
			RETURNING s.user_id, s.activity_key, s.activity_name, s.activity_type, s.application_id, v.duration_seconds, v.ended_at
		)
		INSERT INTO ${activityTotalsTable} (user_id, activity_key, activity_name, activity_type, application_id, total_seconds, session_count, last_played)
		SELECT user_id, activity_key, activity_name, activity_type, application_id, duration_seconds, 1, ended_at FROM updated
		ON CONFLICT (user_id, activity_key) DO UPDATE SET
			total_seconds = ${activityTotalsTable}.total_seconds + EXCLUDED.total_seconds,
			session_count = ${activityTotalsTable}.session_count + 1,
			last_played = GREATEST(COALESCE(${activityTotalsTable}.last_played, 0), EXCLUDED.last_played),
			activity_name = EXCLUDED.activity_name
	`)
}

export function createDefaultSink(): SessionWriteSink {
	return createSessionWriteSink({
		insertSessionRows,
		rollupSessionFinishes,
	})
}

const defaultSink = createDefaultSink()

export const enqueueSessionStart = defaultSink.enqueueStart
export const enqueueSessionFinish = defaultSink.enqueueFinish
export const flushSessionWrites = defaultSink.flush
export const stopSessionBatch = defaultSink.stop

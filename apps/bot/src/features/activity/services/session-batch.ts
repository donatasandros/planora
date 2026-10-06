import { activitySessionsTable, db, eq, sql } from "@workspace/db"
import { logger } from "@/core/logger"
import type {
	FinishOperation,
	PendingOperation,
	SessionStartRow,
	StartOperation,
} from "@/features/activity/types"

const SESSION_WRITE_FLUSH_INTERVAL_MS = 3 * 1000 // 3 seconds
const SESSION_WRITE_MAX_BATCH_OPS = 200

const buffer: PendingOperation[] = []
let timer: NodeJS.Timeout | undefined
let flushing = false

function ensureTimer(): void {
	if (timer) {
		return
	}

	timer = setInterval(() => {
		void flushSessionWrites()
	}, SESSION_WRITE_FLUSH_INTERVAL_MS)

	timer.unref()
}

async function flushStarts(rows: SessionStartRow[]): Promise<Set<string>> {
	const created = await db
		.insert(activitySessionsTable)
		.values(rows)
		.onConflictDoNothing()
		.returning({ id: activitySessionsTable.id })

	return new Set(created.map((row) => row.id))
}

async function flushFinishes(ops: FinishOperation[]): Promise<void> {
	const assignments = ops.map(
		(op) =>
			sql`(${op.id}, ${op.endedAt}::bigint, ${op.durationSeconds}::integer)`
	)

	await db.execute(sql`
		UPDATE ${activitySessionsTable} AS s
		SET ended_at = v.ended_at, duration_seconds = v.duration_seconds
		FROM (VALUES ${sql.join(assignments, sql`, `)}) AS v(id, ended_at, duration_seconds)
		WHERE s.id = v.id
	`)
}

async function flushSingle(op: PendingOperation): Promise<void> {
	if (op.kind === "start") {
		const created = await db
			.insert(activitySessionsTable)
			.values(op.row)
			.onConflictDoNothing()
			.returning({ id: activitySessionsTable.id })

		op.resolve(created.length > 0)

		return
	}

	await db
		.update(activitySessionsTable)
		.set({ endedAt: op.endedAt, durationSeconds: op.durationSeconds })
		.where(eq(activitySessionsTable.id, op.id))

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
			const insertedIds = await flushStarts(starts.map((op) => op.row))

			for (const op of starts) {
				op.resolve(insertedIds.has(op.row.id))
			}
		}

		if (finishes.length > 0) {
			await flushFinishes(finishes)

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

async function flushSessionWritesInternal(): Promise<void> {
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

export async function flushSessionWrites(): Promise<void> {
	await flushSessionWritesInternal()
}

export function enqueueSessionStart(row: SessionStartRow): Promise<boolean> {
	return new Promise<boolean>((resolve, reject) => {
		buffer.push({ kind: "start", row, resolve, reject })
		ensureTimer()

		if (buffer.length >= SESSION_WRITE_MAX_BATCH_OPS) {
			void flushSessionWritesInternal()
		}
	})
}

export function enqueueSessionFinish(
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
			void flushSessionWritesInternal()
		}
	})
}

export async function stopSessionBatch(): Promise<void> {
	if (timer) {
		clearInterval(timer)
		timer = undefined
	}

	await flushSessionWritesInternal()
}

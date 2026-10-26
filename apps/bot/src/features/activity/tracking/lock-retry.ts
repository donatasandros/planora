export type AcquireAttempt = () => Promise<string | null>

export async function acquireLockWithRetry({
	acquire,
	attempts,
	delayMs,
	sleep,
}: {
	acquire: AcquireAttempt
	attempts: number
	delayMs: number
	sleep: (ms: number) => Promise<void>
}): Promise<string | null> {
	for (let attempt = 0; attempt < attempts; attempt++) {
		const token = await acquire()

		if (token) {
			return token
		}

		if (attempt < attempts - 1) {
			await sleep(delayMs)
		}
	}

	return null
}

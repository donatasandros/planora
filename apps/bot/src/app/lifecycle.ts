import { closeDb } from "@workspace/db"
import { env } from "@workspace/env"
import { closeRedis } from "@workspace/redis"
import type { Client } from "discord.js"
import { registerEvents } from "@/core/events/registry"
import { logger } from "@/core/logger"
import {
	type SessionSweeper,
	startSessionSweeperWorker,
	stopSessionBatch,
} from "@/features/activity"

const SHUTDOWN_TIMEOUT_MS = 10 * 1000 // 10 seconds

export function createLifecycle(client: Client) {
	let sweeper: SessionSweeper | undefined
	let shutdownPromise: Promise<void> | undefined
	let shutdownTimer: NodeJS.Timeout | undefined

	function setExitCode(code: number): void {
		const currentExitCode =
			typeof process.exitCode === "number" ? process.exitCode : 0

		process.exitCode = Math.max(currentExitCode, code)
	}

	function shutdown(reason: string, exitCode = 0): Promise<void> {
		setExitCode(exitCode)

		if (shutdownPromise) {
			return shutdownPromise
		}

		shutdownTimer = setTimeout(() => {
			setExitCode(1)
			logger.error({ reason }, "Graceful shutdown timed out")
			process.exit(
				typeof process.exitCode === "number" ? process.exitCode : 1
			)
		}, SHUTDOWN_TIMEOUT_MS)
		shutdownTimer.unref()

		shutdownPromise = (async () => {
			try {
				logger.info({ reason }, "Shutting down bot")

				try {
					await sweeper?.stop()
				} catch (err) {
					logger.error({ err }, "Session sweeper shutdown failed")
				}

				try {
					await stopSessionBatch()
				} catch (err) {
					logger.error(
						{ err },
						"Session write flush failed during shutdown"
					)
				}

				const results = await Promise.allSettled([
					client.destroy(),
					closeRedis(),
					closeDb(),
				])

				for (const result of results) {
					if (result.status === "rejected") {
						logger.error(
							{ err: result.reason },
							"Resource cleanup failed"
						)
					}
				}

				logger.info("Bot shutdown complete")
			} catch (err) {
				logger.error({ err }, "Unexpected shutdown error")
				setExitCode(1)
			} finally {
				if (shutdownTimer) {
					clearTimeout(shutdownTimer)
					shutdownTimer = undefined
				}
			}
		})()

		return shutdownPromise
	}

	async function start(): Promise<void> {
		try {
			await registerEvents(client)
			await client.login(env.DISCORD_BOT_TOKEN)

			sweeper = startSessionSweeperWorker(client)
		} catch (err) {
			logger.error({ err }, "Error during bot startup")

			await shutdown("Startup failure", 1)
		}
	}

	function registerSignalHandlers(): void {
		process.on("unhandledRejection", (reason) => {
			logger.error({ reason }, "Unhandled promise rejection")
			void shutdown("Unhandled promise rejection", 1)
		})

		process.once("SIGINT", () => {
			void shutdown("SIGINT")
		})

		process.once("SIGTERM", () => {
			void shutdown("SIGTERM")
		})
	}

	return { start, shutdown, registerSignalHandlers }
}

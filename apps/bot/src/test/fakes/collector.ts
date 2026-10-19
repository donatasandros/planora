type CollectorEvent = "collect" | "end"

export type CollectorOptions = {
	componentType?: number
	time?: number
}

type Handler = (payload?: unknown) => unknown | Promise<unknown>

export class FakeCollector {
	readonly options: CollectorOptions | undefined
	readonly stopCalls: string[] = []
	resetTimerCalls = 0
	private readonly handlers = new Map<CollectorEvent, Handler[]>()

	constructor(options?: CollectorOptions) {
		this.options = options
	}

	on(event: CollectorEvent, handler: Handler): this {
		const handlers = this.handlers.get(event) ?? []
		handlers.push(handler)
		this.handlers.set(event, handlers)

		return this
	}

	resetTimer(): void {
		this.resetTimerCalls += 1
	}

	stop(reason?: string): void {
		this.stopCalls.push(reason ?? "")
	}

	async emit(event: CollectorEvent, payload?: unknown): Promise<void> {
		for (const handler of this.handlers.get(event) ?? []) {
			await handler(payload)
		}
	}
}

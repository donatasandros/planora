import { type CollectorOptions, FakeCollector } from "@/test/fakes/collector"

export type MessagePayload = {
	embeds?: unknown[]
	components?: unknown[]
	content?: string
	flags?: number
}

export class FakeMessage {
	readonly edits: MessagePayload[] = []
	createdTimestamp = 1_700_000_000_000
	collector: FakeCollector | undefined
	interactionMetadata?: { user: { id: string } }

	async edit(payload: MessagePayload): Promise<this> {
		this.edits.push(payload)
		return this
	}

	createMessageComponentCollector(options?: CollectorOptions): FakeCollector {
		this.collector = new FakeCollector(options)
		return this.collector
	}
}

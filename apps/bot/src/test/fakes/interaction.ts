import { FakeMessage, type MessagePayload } from "@/test/fakes/message"

export type InteractionUser = { id: string }

export class FakeChatInputCommandInteraction {
	readonly user: InteractionUser
	readonly message: FakeMessage
	readonly editReplies: MessagePayload[] = []
	readonly replies: MessagePayload[] = []
	readonly followUps: MessagePayload[] = []
	readonly deferReplies: MessagePayload[] = []
	createdTimestamp = 1_700_000_000_000
	deferred = false
	replied = false

	constructor(options: { userId?: string; message?: FakeMessage } = {}) {
		this.user = { id: options.userId ?? "user-1" }
		this.message = options.message ?? new FakeMessage()
	}

	async editReply(payload: MessagePayload): Promise<FakeMessage> {
		this.editReplies.push(payload)

		return this.message
	}

	async deferReply(payload?: MessagePayload): Promise<void> {
		this.deferred = true

		if (payload) {
			this.deferReplies.push(payload)
		}
	}

	async reply(payload: MessagePayload): Promise<void> {
		this.replied = true
		this.replies.push(payload)
	}

	async followUp(payload: MessagePayload): Promise<void> {
		this.followUps.push(payload)
	}
}

export type ModalSubmitOptions = {
	filter?: (interaction: FakeModalSubmitInteraction) => boolean
	time?: number
}

export class FakeButtonInteraction {
	readonly user: InteractionUser
	readonly customId: string
	readonly replies: MessagePayload[] = []
	readonly followUps: MessagePayload[] = []
	readonly shownModals: unknown[] = []
	deferUpdateCalls = 0
	deferred = false
	replied = false
	private resolveModal?: (interaction: FakeModalSubmitInteraction) => void
	private rejectModal?: (error: unknown) => void
	private readonly modalSubmit: Promise<FakeModalSubmitInteraction>
	private modalOptions: ModalSubmitOptions | undefined

	constructor(options: { customId: string; userId?: string }) {
		this.customId = options.customId
		this.user = { id: options.userId ?? "user-1" }
		this.modalSubmit = new Promise((resolve, reject) => {
			this.resolveModal = resolve
			this.rejectModal = reject
		})
	}

	async deferUpdate(): Promise<void> {
		this.deferUpdateCalls += 1
		this.deferred = true
	}

	async reply(payload: MessagePayload): Promise<void> {
		this.replied = true
		this.replies.push(payload)
	}

	async followUp(payload: MessagePayload): Promise<void> {
		this.followUps.push(payload)
	}

	async showModal(modal: unknown): Promise<void> {
		this.shownModals.push(modal)
	}

	async awaitModalSubmit(
		options?: ModalSubmitOptions
	): Promise<FakeModalSubmitInteraction> {
		this.modalOptions = options

		return this.modalSubmit
	}

	submitModal(interaction: FakeModalSubmitInteraction): boolean {
		const filter = this.modalOptions?.filter

		if (filter && !filter(interaction)) {
			return false
		}

		this.resolveModal?.(interaction)

		return true
	}

	timeoutModal(): void {
		this.rejectModal?.(new Error("Modal submit timed out"))
	}
}

export class FakeModalSubmitInteraction {
	readonly user: InteractionUser
	readonly customId: string
	readonly values: Record<string, string>
	readonly replies: MessagePayload[] = []
	readonly followUps: MessagePayload[] = []
	readonly fields: { getTextInputValue: (id: string) => string }
	deferred = false
	replied = false

	constructor(options: {
		customId: string
		userId?: string
		values: Record<string, string>
	}) {
		this.user = { id: options.userId ?? "user-1" }
		this.customId = options.customId
		this.values = options.values
		this.fields = {
			getTextInputValue: (id: string) => this.values[id] ?? "",
		}
	}

	async reply(payload: MessagePayload): Promise<void> {
		this.replied = true
		this.replies.push(payload)
	}

	async followUp(payload: MessagePayload): Promise<void> {
		this.followUps.push(payload)
	}

	async deferUpdate(): Promise<void> {
		this.deferred = true
	}
}

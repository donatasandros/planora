import { FakeMessage, type MessagePayload } from "@/test/fakes/message"

export type InteractionUser = { id: string }

export class FakeChatInputCommandInteraction {
	readonly user: InteractionUser
	readonly message: FakeMessage
	readonly editReplies: MessagePayload[] = []
	readonly replies: MessagePayload[] = []
	readonly followUps: MessagePayload[] = []
	readonly deferReplies: MessagePayload[] = []
	readonly guild: { id: string } | null
	createdTimestamp = 1_700_000_000_000
	deferred = false
	replied = false

	constructor(
		options: {
			userId?: string
			message?: FakeMessage
			guildId?: string | null
		} = {}
	) {
		this.user = { id: options.userId ?? "user-1" }
		this.message = options.message ?? new FakeMessage()
		this.guild =
			options.guildId === null ? null : { id: options.guildId ?? "guild-1" }
	}

	async editReply(payload: MessagePayload): Promise<FakeMessage> {
		this.editReplies.push(payload)

		return this.message
	}

	async fetchReply(): Promise<FakeMessage> {
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
	readonly message?: FakeMessage
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

	constructor(options: {
		customId: string
		userId?: string
		message?: FakeMessage
	}) {
		this.customId = options.customId
		this.user = { id: options.userId ?? "user-1" }
		this.message = options.message
		this.modalSubmit = new Promise((resolve, reject) => {
			this.resolveModal = resolve
			this.rejectModal = reject
		})
	}

	isButton(): boolean {
		return true
	}

	isModalSubmit(): boolean {
		return false
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
	readonly message?: FakeMessage
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
		message?: FakeMessage
	}) {
		this.user = { id: options.userId ?? "user-1" }
		this.customId = options.customId
		this.values = options.values
		this.message = options.message
		this.fields = {
			getTextInputValue: (id: string) => this.values[id] ?? "",
		}
	}

	isButton(): boolean {
		return false
	}

	isModalSubmit(): boolean {
		return true
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

import type {
	ButtonInteraction,
	Message,
	ModalSubmitInteraction,
} from "discord.js"

export type ComponentControls = {
	resetTimer: () => void
	stop: (reason?: string) => void
}

export type ButtonHandler = (
	interaction: ButtonInteraction,
	controls: ComponentControls
) => Promise<void> | void

export type ModalHandler = (
	interaction: ModalSubmitInteraction
) => Promise<void> | void

export type ComponentInstance = {
	kind: "button" | "modal"
	feature: string
	match: (customId: string) => boolean
	ownerOnly?: boolean
	onButton?: ButtonHandler
	onModal?: ModalHandler
}

export type OpenViewOptions = {
	feature: string
	sessionId: string
	ownerId: string
	message: Message
	time: number
	onButton?: ButtonHandler
	onModal?: ModalHandler
}

export type ViewHandle = {
	feature: string
	sessionId: string
	ownerId: string
	closed: boolean
	onModal?: ModalHandler
	resetExpiry: () => void
	close: () => Promise<void>
}

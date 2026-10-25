import {
	type ButtonInteraction,
	ComponentType,
	type InteractionCollector,
	type Message,
	MessageFlags,
	type ModalSubmitInteraction,
} from "discord.js"
import type {
	ButtonHandler,
	ComponentControls,
	ComponentInstance,
	OpenViewOptions,
	ViewHandle,
} from "@/core/components/types"
import { loadFeatureModules } from "@/core/handlers/load-feature-modules"
import { logger } from "@/core/logger"
import { replyError } from "@/shared/discord/interaction"

const OWNER_ONLY_MESSAGE =
	"Only the original user can interact with this button."

type ViewState = ViewHandle & {
	message: Message
	time: number
	onButton: ButtonHandler | undefined
	collector: InteractionCollector<ButtonInteraction>
	timer: NodeJS.Timeout | undefined
}

export type ComponentRegistry = {
	register: (instances: ComponentInstance[]) => void
	openView: (options: OpenViewOptions) => ViewHandle
	getView: (
		feature: string,
		sessionId: string | undefined
	) => ViewHandle | undefined
	match: (
		feature: string,
		kind: ComponentInstance["kind"],
		customId: string
	) => ComponentInstance | undefined
}

function viewKey(feature: string, sessionId: string): string {
	return `${feature}:${sessionId}`
}

export async function runComponentHandler(
	interaction: ButtonInteraction | ModalSubmitInteraction,
	options: { ownerId: string | undefined; ownerOnly: boolean },
	run: () => Promise<void> | void
): Promise<void> {
	try {
		if (options.ownerOnly && interaction.user.id !== options.ownerId) {
			await interaction.reply({
				content: OWNER_ONLY_MESSAGE,
				flags: MessageFlags.Ephemeral,
			})

			return
		}

		await run()
	} catch (err) {
		logger.error(
			{
				err,
				userId: interaction.user.id,
				customId: interaction.customId,
			},
			"Component interaction handler failed"
		)

		await replyError(interaction)
	}
}

export function createComponentRegistry(): ComponentRegistry {
	const instances = new Map<string, ComponentInstance[]>()
	const views = new Map<string, ViewState>()

	function register(newInstances: ComponentInstance[]): void {
		for (const instance of newInstances) {
			const existing = instances.get(instance.feature) ?? []

			existing.push(instance)
			instances.set(instance.feature, existing)
		}
	}

	function match(
		feature: string,
		kind: ComponentInstance["kind"],
		customId: string
	): ComponentInstance | undefined {
		return instances
			.get(feature)
			?.find(
				(instance) => instance.kind === kind && instance.match(customId)
			)
	}

	async function closeView(
		view: ViewState,
		stopCollector: boolean
	): Promise<void> {
		if (view.closed) {
			return
		}

		view.closed = true

		if (view.timer) {
			clearTimeout(view.timer)
			view.timer = undefined
		}

		views.delete(viewKey(view.feature, view.sessionId))

		if (stopCollector) {
			view.collector.stop("expired")
		}

		await view.message.edit({ components: [] }).catch(() => undefined)
	}

	function scheduleExpiry(view: ViewState): void {
		if (view.closed) {
			return
		}

		if (view.timer) {
			clearTimeout(view.timer)
		}

		const timer = setTimeout(() => {
			void closeView(view, true)
		}, view.time)

		timer.unref()
		view.timer = timer
	}

	function createControls(view: ViewState): ComponentControls {
		return {
			resetTimer: () => {
				if (view.closed) {
					return
				}

				view.collector.resetTimer()
				scheduleExpiry(view)
			},
			stop: (reason) => {
				view.collector.stop(reason)
			},
		}
	}

	function openView(options: OpenViewOptions): ViewHandle {
		const key = viewKey(options.feature, options.sessionId)

		if (views.has(key)) {
			throw new Error(`Component view already open: ${key}`)
		}

		const collector = options.message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: options.time,
		})

		const view: ViewState = {
			feature: options.feature,
			sessionId: options.sessionId,
			ownerId: options.ownerId,
			closed: false,
			message: options.message,
			time: options.time,
			onButton: options.onButton,
			onModal: options.onModal,
			collector,
			timer: undefined,
			resetExpiry: () => scheduleExpiry(view),
			close: () => closeView(view, true),
		}

		collector.on("collect", async (buttonInteraction) => {
			await runComponentHandler(
				buttonInteraction,
				{ ownerId: view.ownerId, ownerOnly: true },
				async () => {
					await view.onButton?.(buttonInteraction, createControls(view))
				}
			)
		})

		collector.on("end", async () => {
			await closeView(view, false)
		})

		views.set(key, view)
		scheduleExpiry(view)

		return view
	}

	return {
		register,
		openView,
		getView: (feature, sessionId) =>
			sessionId === undefined
				? undefined
				: views.get(viewKey(feature, sessionId)),
		match,
	}
}

export const componentRegistry = createComponentRegistry()

export async function loadComponents(
	registry: ComponentRegistry = componentRegistry
): Promise<void> {
	const modules = await loadFeatureModules("components")
	let total = 0

	for (const { mod, filePath } of modules) {
		let found = 0

		for (const item of Object.values(mod).flat()) {
			const candidate = item as Partial<ComponentInstance>

			if (
				!candidate ||
				typeof candidate !== "object" ||
				(candidate.kind !== "button" && candidate.kind !== "modal") ||
				typeof candidate.feature !== "string" ||
				typeof candidate.match !== "function"
			) {
				continue
			}

			const hasHandler =
				candidate.kind === "button"
					? typeof candidate.onButton === "function"
					: typeof candidate.onModal === "function"

			if (!hasHandler) {
				continue
			}

			registry.register([candidate as ComponentInstance])
			found++
		}

		total += found

		if (found === 0) {
			logger.warn({ filePath }, "Component file exported no components")
		}
	}

	logger.info({ count: total }, "Loaded components")
}

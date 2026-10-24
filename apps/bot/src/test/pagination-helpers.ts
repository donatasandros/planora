import {
	collectCustomIds,
	FakeButtonInteraction,
	FakeChatInputCommandInteraction,
	type FakeCollector,
	type MessagePayload,
} from "@/test/fakes"

type ButtonJson = {
	custom_id?: string
	disabled?: boolean
}

export const OWNER_ID = "owner"
export const OTHER_USER_ID = "other-user"

export function createInteraction(
	userId: string = OWNER_ID
): FakeChatInputCommandInteraction {
	return new FakeChatInputCommandInteraction({ userId })
}

export function getCollector(
	interaction: FakeChatInputCommandInteraction
): FakeCollector {
	const collector = interaction.message.collector

	if (!collector) {
		throw new Error("Expected a component collector to exist")
	}

	return collector
}

export function getButtons(payload: MessagePayload | undefined): ButtonJson[] {
	const row = payload?.components?.[0] as
		| { toJSON: () => { components?: ButtonJson[] } }
		| undefined

	if (!row) {
		throw new Error("Expected an action row in the payload")
	}

	return row.toJSON().components ?? []
}

export function getButtonIds(payload: MessagePayload | undefined): string[] {
	return collectCustomIds(payload?.components?.[0])
}

export function findId(ids: string[], suffix: string): string {
	const id = ids.find((candidate) => candidate.endsWith(suffix))

	if (!id) {
		throw new Error(`Expected a button id ending with "${suffix}"`)
	}

	return id
}

export function actionName(customId: string | undefined): string | undefined {
	return customId?.split(":").at(-1)
}

export function createButton(
	ids: string[],
	suffix: string,
	userId: string = OWNER_ID
): FakeButtonInteraction {
	return new FakeButtonInteraction({
		customId: findId(ids, suffix),
		userId,
	})
}

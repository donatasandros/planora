import { type ChatInputCommandInteraction, MessageFlags } from "discord.js"

type DenyReason = "private" | "unavailable" | "blacklisted" | "untracked"

type Visibility =
	| { allowed: true; ephemeral: boolean }
	| { allowed: false; reason: DenyReason }

type ResolveVisibility = (
	viewerId: string,
	targetId: string,
	options: { isDirectMessage: boolean }
) => Promise<Visibility>

type ViewProfileOptions = {
	interaction: ChatInputCommandInteraction
	targetUserId: string
	targetUsername: string
	resolveVisibility: ResolveVisibility
}

export type ProfileViewResult =
	| { status: "allowed"; ephemeral: boolean }
	| { status: "denied"; reason: DenyReason }

function denyMessage(reason: DenyReason, username: string): string {
	switch (reason) {
		case "private":
			return `${username}'s profile is private.`
		case "unavailable":
			return `Could not verify access to this profile, please try again later.`
		case "blacklisted":
		case "untracked":
			return `${username}'s profile is not available.`
	}
}

export async function viewProfile({
	interaction,
	targetUserId,
	targetUsername,
	resolveVisibility,
}: ViewProfileOptions): Promise<ProfileViewResult> {
	const visibility = await resolveVisibility(
		interaction.user.id,
		targetUserId,
		{ isDirectMessage: interaction.guild === null }
	)

	if (!visibility.allowed) {
		await interaction.reply({
			content: denyMessage(visibility.reason, targetUsername),
			flags: MessageFlags.Ephemeral,
		})

		return {
			status: "denied",
			reason: visibility.reason,
		}
	}

	await interaction.deferReply({
		flags: visibility.ephemeral ? MessageFlags.Ephemeral : undefined,
	})

	return {
		status: "allowed",
		ephemeral: visibility.ephemeral,
	}
}

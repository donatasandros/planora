import {
	type ChatInputCommandInteraction,
	type Client,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js"
import { getSystemInfo } from "@/features/utility/utils/system-info"
import { COLORS } from "@/shared/constants/colors"
import { formatTime } from "@/shared/utils/time"

export const data = new SlashCommandBuilder()
	.setName("info")
	.setDescription("View bot performance, statistics, and system information.")

export async function execute(
	client: Client,
	interaction: ChatInputCommandInteraction
) {
	await interaction.deferReply()

	const reply = await interaction.fetchReply()

	const systemInfo = await getSystemInfo()

	const clientLatency = reply.createdTimestamp - interaction.createdTimestamp
	const websocketLatency = client.ws.ping

	const totalUsers = client.guilds.cache.reduce(
		(acc, guild) => acc + guild.memberCount,
		0
	)

	const embed = new EmbedBuilder()
		.setColor(COLORS.primary)
		.setTitle("Bot Information")
		.addFields(
			{
				name: "System",
				value:
					`• Node.js: \`${systemInfo.system.nodeVersion}\`\n` +
					`• Platform: \`${systemInfo.system.platform}\``,
			},
			{
				name: "Performance",
				value:
					`• Memory: \`${systemInfo.process.memoryUsage}/${systemInfo.system.totalMemory} MB\`\u200b\u200b\n` +
					`• CPU Usage: \`${systemInfo.process.cpuUsage}%\`\n` +
					`• Uptime: \`${formatTime(Math.floor((client.uptime ?? 0) / 1000))}\`\n`,
			},
			{
				name: "Latency",
				value:
					`• Client Latency: \`${clientLatency} ms\`\n` +
					`• WebSocket Latency: \`${websocketLatency} ms\`\n\n`,
			},
			{
				name: "Statistics",
				value:
					`• Servers: \`${client.guilds.cache.size.toLocaleString()}\`\n` +
					`• Users: \`${totalUsers}\`\n\n`,
			}
		)

	await interaction.editReply({ embeds: [embed] })
}

import {
  activitySessionsTable,
  and,
  db,
  desc,
  eq,
  isNotNull,
  max,
  sum,
} from "@workspace/db"
import {
  type APIEmbed,
  type ChatInputCommandInteraction,
  type Client,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js"
import { COLORS } from "@/constants/colors"
import { getActiveSessions } from "@/lib/activity-sessions"
import { logger } from "@/lib/logger"
import { splitIntoChunks } from "@/utils/array"
import { discordTimestamp } from "@/utils/discord"
import paginate from "@/utils/pagination"
import { formatTime } from "@/utils/time"

const LINES_PER_EMBED = 12

type CurrentActivity = {
  activityName: string
  startedAt: number | null
}

type PastActivity = {
  activityName: string
  timePlayed: number | null
  lastPlayed: number | null
}

export const data = new SlashCommandBuilder()
  .setName("activity")
  .setDescription("View user activity statistics.")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to check activity for")
      .setRequired(false)
  )

async function getCurrentActivities(
  interaction: ChatInputCommandInteraction,
  userId: string
): Promise<CurrentActivity[]> {
  const presence = interaction.guild?.presences.cache.get(userId)

  if (presence) {
    return presence.activities.map((activity) => {
      const startedAt = activity.timestamps?.start

      return {
        activityName: activity.name,
        startedAt:
          startedAt instanceof Date
            ? Math.floor(startedAt.getTime() / 1000)
            : null,
      }
    })
  }

  const activeSessions = await getActiveSessions(userId)

  return Object.values(activeSessions).map((session) => ({
    activityName: session.activityName,
    startedAt: session.startedAt,
  }))
}

async function getPastActivities(userId: string): Promise<PastActivity[]> {
  const totalDuration = sum(activitySessionsTable.durationSeconds)

  return db
    .select({
      activityName: activitySessionsTable.activityName,
      timePlayed: totalDuration.mapWith(Number),
      lastPlayed: max(activitySessionsTable.endedAt),
    })
    .from(activitySessionsTable)
    .where(
      and(
        eq(activitySessionsTable.userId, userId),
        isNotNull(activitySessionsTable.endedAt)
      )
    )
    .groupBy(activitySessionsTable.activityName)
    .orderBy(desc(totalDuration))
}

function formatCurrentActivity(activity: CurrentActivity): string {
  const startedAt =
    activity.startedAt === null ? "now" : discordTimestamp(activity.startedAt)

  return `**•** \`${activity.activityName}\` - ${startedAt}`
}

function formatPastActivity(activity: PastActivity): string {
  const timePlayed = formatTime(activity.timePlayed ?? 0)

  const lastPlayed =
    activity.lastPlayed === null
      ? "Unknown"
      : discordTimestamp(activity.lastPlayed)

  return (
    `**•** \`${activity.activityName}\` - ` + `${timePlayed} - ${lastPlayed}`
  )
}

function buildActivityPages(
  username: string,
  pastActivities: PastActivity[],
  currentActivities: CurrentActivity[]
): {
  embeds: APIEmbed[]
  searchTerms: string[]
} {
  const totalTime = pastActivities.reduce(
    (total, activity) => total + (activity.timePlayed ?? 0),
    0
  )

  const currentActivityLines = currentActivities.map((activity) =>
    formatCurrentActivity(activity)
  )

  const firstPageLines: string[] = [
    `**Total time tracked:** ${formatTime(totalTime)}`,
    "",
  ]

  if (currentActivityLines.length > 0) {
    firstPageLines.push("**Current activities:**", ...currentActivityLines, "")
  }

  firstPageLines.push("**All activities:**")

  const availablePastActivityLines = Math.max(
    0,
    LINES_PER_EMBED - firstPageLines.length
  )

  const firstPageActivities = pastActivities.slice(
    0,
    availablePastActivityLines
  )

  if (firstPageActivities.length > 0) {
    firstPageLines.push(
      ...firstPageActivities.map((activity) => formatPastActivity(activity))
    )
  } else if (pastActivities.length === 0) {
    firstPageLines.push("*No activities tracked.*")
  }

  const embeds: APIEmbed[] = [
    new EmbedBuilder()
      .setColor(COLORS.primary)
      .setTitle(`${username}'s Activity`)
      .setDescription(firstPageLines.join("\n"))
      .toJSON(),
  ]

  const searchTerms: string[] = [
    [...firstPageActivities.map((activity) => activity.activityName)].join(" "),
  ]

  const remainingActivities = pastActivities.slice(firstPageActivities.length)

  for (const activityChunk of splitIntoChunks(
    remainingActivities,
    LINES_PER_EMBED
  )) {
    embeds.push(
      new EmbedBuilder()
        .setColor(COLORS.primary)
        .setTitle(`${username}'s Activity`)
        .setDescription(activityChunk.map(formatPastActivity).join("\n"))
        .toJSON()
    )

    searchTerms.push(
      activityChunk.map((activity) => activity.activityName).join(" ")
    )
  }

  return {
    embeds,
    searchTerms,
  }
}

export async function execute(
  _client: Client,
  interaction: ChatInputCommandInteraction
) {
  await interaction.deferReply()

  const user = interaction.options.getUser("user") ?? interaction.user

  try {
    const [pastActivities, currentActivities] = await Promise.all([
      getPastActivities(user.id),
      getCurrentActivities(interaction, user.id),
    ])

    const { embeds, searchTerms } = buildActivityPages(
      user.username,
      pastActivities,
      currentActivities
    )

    await paginate({
      interaction,
      embeds,
      search: {
        terms: searchTerms,
        title: "Search activity",
        label: "Activity name",
        placeholder: "e.g. Minecraft",
        notFoundMessage: "Activity not found.",
      },
    })
  } catch (err) {
    logger.error({ err, userId: user.id }, "Failed to load activity statistics")

    await interaction.editReply({
      content: "Failed to load activity statistics.",
      embeds: [],
      components: [],
    })
  }
}

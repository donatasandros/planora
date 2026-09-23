import {
   type APIEmbed,
   type ChatInputCommandInteraction,
   type Client,
   EmbedBuilder,
   SlashCommandBuilder,
} from "discord.js"
import { logger } from "@/core/logger"
import { activityService } from "@/features/activity/services/activity.service"
import type { CurrentActivity, PastActivity } from "@/features/activity/types"
import { formatActivityRow } from "@/features/activity/utils/formatting"
import { COLORS } from "@/shared/constants/colors"
import { ITEMS_PER_PAGE } from "@/shared/constants/pagination"
import { splitIntoChunks } from "@/shared/utils/array"
import paginate from "@/shared/utils/pagination"
import { formatTime } from "@/shared/utils/time"

export const data = new SlashCommandBuilder()
   .setName("activity")
   .setDescription("View user activity statistics.")
   .addUserOption((option) =>
      option
         .setName("user")
         .setDescription("The user to check activity for")
         .setRequired(false)
   )

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
      formatActivityRow(activity.activityName, {
         timestamp: activity.startedAt,
      })
   )

   const firstPageLines: string[] = [
      `**Total time tracked:** ${formatTime(totalTime)}`,
      "",
   ]

   if (currentActivityLines.length > 0) {
      firstPageLines.push(
         "**Current activities:**",
         ...currentActivityLines,
         ""
      )
   }

   firstPageLines.push("**All activities:**")

   const availablePastActivityLines = Math.max(
      0,
      ITEMS_PER_PAGE - firstPageLines.length
   )

   const firstPageActivities = pastActivities.slice(
      0,
      availablePastActivityLines
   )

   if (firstPageActivities.length > 0) {
      firstPageLines.push(
         ...firstPageActivities.map((activity) =>
            formatActivityRow(activity.activityName, {
               durationSeconds: activity.timePlayed,
               timestamp: activity.lastPlayed,
            })
         )
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
      [...firstPageActivities.map((activity) => activity.activityName)].join(
         " "
      ),
   ]

   const remainingActivities = pastActivities.slice(firstPageActivities.length)

   for (const activityChunk of splitIntoChunks(
      remainingActivities,
      ITEMS_PER_PAGE
   )) {
      embeds.push(
         new EmbedBuilder()
            .setColor(COLORS.primary)
            .setTitle(`${username}'s Activity`)
            .setDescription(
               activityChunk
                  .map((activity) =>
                     formatActivityRow(activity.activityName, {
                        durationSeconds: activity.timePlayed,
                        timestamp: activity.lastPlayed,
                     })
                  )
                  .join("\n")
            )
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
         activityService.getPastActivities(user.id),
         activityService.getCurrentActivities(interaction, user.id),
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
      logger.error(
         { err, userId: user.id },
         "Failed to load activity statistics"
      )

      await interaction.editReply({
         content: "Failed to load activity statistics.",
         embeds: [],
         components: [],
      })
   }
}

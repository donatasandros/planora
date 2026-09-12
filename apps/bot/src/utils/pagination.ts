import {
  ActionRowBuilder,
  type APIEmbed,
  ButtonBuilder,
  type ButtonInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  ComponentType,
  LabelBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js"
import { emojis } from "@/constants/emojis"

type SearchParams = {
  terms: string[]
  title: string
  label: string
  placeholder: string
  notFoundMessage: string
}

type PaginateParams = {
  interaction: ChatInputCommandInteraction
  embeds: APIEmbed[]
  search?: SearchParams
  time?: number
}

export default async function paginate({
  interaction,
  embeds,
  search,
  time = 30 * 1000, // 30 seconds
}: PaginateParams) {
  if (embeds.length === 0) {
    throw new Error("Pagination requires at least one page")
  }

  if (embeds.length === 1) {
    return await interaction.editReply({
      embeds,
      components: [],
    })
  }

  const buttons = {
    first: new ButtonBuilder()
      .setCustomId("first")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
      .setEmoji(emojis.pagination.first),
    previous: new ButtonBuilder()
      .setCustomId("previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
      .setEmoji(emojis.pagination.previous),
    search: new ButtonBuilder()
      .setCustomId("search")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(emojis.pagination.search),
    next: new ButtonBuilder()
      .setCustomId("next")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(emojis.pagination.next),
    last: new ButtonBuilder()
      .setCustomId("last")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(emojis.pagination.last),
  }

  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    buttons.first,
    buttons.previous,
    ...(search ? [buttons.search] : []),
    buttons.next,
    buttons.last
  )

  let index = 0

  function updateButtonState() {
    const isFirstPage = index === 0
    const isLastPage = index === embeds.length - 1

    buttons.first.setDisabled(isFirstPage)
    buttons.previous.setDisabled(isFirstPage)
    buttons.next.setDisabled(isLastPage)
    buttons.last.setDisabled(isLastPage)
  }

  updateButtonState()

  const message = await interaction.editReply({
    embeds: [embeds[index]],
    components: [actionRow],
  })

  function handlePageChange(customId: string) {
    switch (customId) {
      case "first":
        index = 0
        break
      case "previous":
        index = Math.max(index - 1, 0)
        break
      case "next":
        index = Math.min(index + 1, embeds.length - 1)
        break
      case "last":
        index = embeds.length - 1
        break
      default:
        return false
    }

    return true
  }

  async function handleRender() {
    updateButtonState()

    await message.edit({
      embeds: [embeds[index]],
      components: [actionRow],
    })
  }

  async function handleSearch(buttonInteraction: ButtonInteraction) {
    if (!search) return false

    const modal = new ModalBuilder()
      .setCustomId("pagination-search")
      .setTitle(search.title)

    const searchInput = new TextInputBuilder()
      .setCustomId("search-query")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder(search.placeholder)
      .setRequired(true)

    const searchLabel = new LabelBuilder()
      .setLabel(search.label)
      .setTextInputComponent(searchInput)

    modal.addLabelComponents(searchLabel)

    await buttonInteraction.showModal(modal)

    const submitted = await buttonInteraction
      .awaitModalSubmit({
        filter: (modalInteraction) =>
          modalInteraction.customId === "pagination-search" &&
          modalInteraction.user.id === interaction.user.id,
        time,
      })
      .catch(() => null)

    if (!submitted) return false

    const query = submitted.fields
      .getTextInputValue("search-query")
      .trim()
      .toLowerCase()

    const pageIndex = search.terms.findIndex((term) =>
      term.toLowerCase().includes(query)
    )

    if (pageIndex === -1) {
      await submitted.reply({
        content: search.notFoundMessage,
        flags: MessageFlags.Ephemeral,
      })

      return false
    }

    index = pageIndex
    await submitted.deferUpdate()

    return true
  }

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time,
  })

  collector.on("collect", async (buttonInteraction) => {
    if (buttonInteraction.user.id !== interaction.user.id) {
      return await buttonInteraction.reply({
        content: "Only the original user can interact with this button.",
        flags: MessageFlags.Ephemeral,
      })
    }

    collector.resetTimer()

    if (buttonInteraction.customId === "search") {
      const shouldRender = await handleSearch(buttonInteraction)

      if (shouldRender) {
        await handleRender()
      }

      return
    }

    await buttonInteraction.deferUpdate()

    if (handlePageChange(buttonInteraction.customId)) {
      await handleRender()
    }
  })

  collector.on("end", async () => {
    void message
      .edit({
        components: [],
      })
      .catch(() => undefined)
  })

  return message
}

import type {
  Client as BaseClient,
  Collection,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js"

export interface CommandModule {
  data: SlashCommandBuilder
  execute: (
    client: BaseClient,
    interaction: CommandInteraction
  ) => Promise<void>
}

declare module "discord.js" {
  interface Client {
    commands: Collection<string, CommandModule>
  }
}

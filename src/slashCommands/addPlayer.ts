import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../types";
import {
  searchDestinyPlayer,
  getCurrentSeasonPassDefinition,
  getRecordDefinition,
  getPlayerAccountAndCharacterInformation,
  getReplyAccountStats,
  getHighestCharacterForDestinyPlayer,
} from "../functions";

const AddPlayerCommand: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Adds player to the database for the leaderboard.")
    .addStringOption((option) => {
      return option
        .setName("name")
        .setDescription("The name of the player before the #.")
        .setRequired(true);
    })
    .addStringOption((option) => {
      return option
        .setMinLength(4)
        .setMaxLength(4)
        .setName("code")
        .setDescription("The code of the Bungie ID for the player.")
        .setRequired(true);
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  execute: async (interaction) => {
    const name: string = interaction.options.get("name")?.value + "";
    const code: string = interaction.options.get("code")?.value + "";

    const displayName = name
      .trim()
      .replace(
        /[\!\#\$\%\^\&\*\)\(\+\=\.\<\>\{\}\[\]\:\;\'\"\|\~\`\_\-]/g,
        "\\$&"
      );

    if (!code.match(/[0-9]{4}/)) {
      console.log(code);
      await interaction.reply({
        content: `Please enter a valid code. You entered ${code}`,
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `Looking up player ${displayName}#${code}`,
      ephemeral: true,
    });

    const { membershipId, membershipType } = await searchDestinyPlayer(
      name,
      code
    );
    const currentSeason = await getCurrentSeasonPassDefinition();
    const record = await getRecordDefinition();
    const player = await getPlayerAccountAndCharacterInformation(
      membershipType,
      membershipId
    );
    const stats = await getReplyAccountStats(membershipType, membershipId);

    if (
      player.profileProgression.data === undefined ||
      player.characterProgressions.data === undefined
    )
      return interaction.editReply({
        content: `User (${name}#${code}) does not have public progression on their account.`,
      });
    console.log(
      getHighestCharacterForDestinyPlayer(
        player,
        stats,
        currentSeason,
        record,
        name,
        code
      )
    );

    return;
  },
  cooldown: 10,
};

export default AddPlayerCommand;

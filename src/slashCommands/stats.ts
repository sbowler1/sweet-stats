import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import leaderboard from "../utils/leaderboard";
import prisma from "../prisma";

const StatsCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("stat")
        .setDescription("Generates a new leaderboard."),
    execute: async (interaction) => {
        // Check bot has been configured in the server
        let guildPrefsChannel;
        let guildId = interaction.guildId ? interaction.guildId : "";
        if (guildId !== "") {
            guildPrefsChannel = await prisma.guildPrefs.findFirst({
                where: {
                    guildId,
                },
            });
        } else {
            await interaction.reply({
                content: `This command can only be used in a server.`,
                ephemeral: true,
            });
            return;
        }

        if (!guildPrefsChannel) {
            await interaction.reply({
                content: `Bot has not been configured for this server.`,
                ephemeral: true,
            });
            return;
        }

        leaderboard(interaction, guildPrefsChannel);
        await interaction.reply({
            content: `Generating Leaderboard. Please wait...`,
            ephemeral: true,
        });

        setTimeout(() => interaction.deleteReply(), 5000);
    },
};

export default StatsCommand;

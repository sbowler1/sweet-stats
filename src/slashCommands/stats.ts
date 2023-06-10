import { SlashCommandBuilder } from "discord.js";
import { SlashCommand } from "../types";
import leaderboard from "../utils/leaderboard";

const StatsCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("stat")
        .setDescription("Generates a new leaderboard."),
    execute: async (interaction) => {
        leaderboard(interaction);
        await interaction.reply({
            content: `Generating Leaderboard. Please wait...`,
            ephemeral: true,
        });

        setTimeout(() => interaction.deleteReply(), 5000);
    },
};

export default StatsCommand;

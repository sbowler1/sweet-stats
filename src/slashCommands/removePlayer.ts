import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { SlashCommand } from "../types";
import prisma from "../prisma";

const RemovePlayerCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("Removes player from the database for the leaderboard.")
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
        const guildId: string = interaction.guildId ? interaction.guildId : "";

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

        const loading = await interaction.reply({
            content: `Looking up player ${displayName}#${code}`,
            ephemeral: true,
        });

        const player = await prisma.guildPlayer.findFirst({
            where: {
                guildId: guildId,
                displayName: `${name}#${code}`,
            },
        });

        if (!player) {
            await loading.edit({
                content: `Could not find player ${displayName}#${code}.`,
            });
            return;
        }

        await prisma.guildPlayer.delete({
            where: {
                id: player.id,
            },
        });

        await loading.edit({
            content: `Removed player ${displayName}#${code}.`,
        });
    },
};

export default RemovePlayerCommand;

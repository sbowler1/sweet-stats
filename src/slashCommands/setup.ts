import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    Guild,
    ChannelType,
} from "discord.js";
import prisma from "../prisma";
import { SlashCommand } from "../types";

const SetupCommand: SlashCommand = {
    command: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Sets up the leaderboard for the server.")
        .addChannelOption((option) => {
            return option
                .setName("channel")
                .setDescription("The channel to setup the leaderboard in.")
                .setRequired(false);
        })
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    execute: async (interaction) => {
        const channel = interaction.options.get("channel");
        console.log(channel);
        const { guild, guildId } = interaction;
        if (!guildId || !guild) {
            await interaction.reply({
                content: `This command can only be run in a server.`,
                ephemeral: true,
            });
            return;
        }
        const guildExists = await prisma.guildPrefs.findUnique({
            where: {
                guildId,
            },
        });
        if (guildExists) {
            await interaction.reply({
                content: `The leaderboard has already been setup for ${guild?.name}.`,
                ephemeral: true,
            });
            return;
        } else {
            const channel = await guild.channels.create({
                name: "leaderboard",
                type: ChannelType.GuildText,
                topic: "The leaderboard for the server.",
            });

            await prisma.guildPrefs.create({
                data: {
                    guildId,
                    channelId: channel.id,
                },
            });

            await interaction.reply({
                content: `A new channel has been created! Access it here: <#${channel.id}>. Use /add in that channel to start adding Guardians to be added to the leaderboard.`,
                ephemeral: true,
            });
            return;
        }
    },
};

export default SetupCommand;

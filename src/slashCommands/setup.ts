import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    Guild,
    ChannelType,
    Channel,
    CommandInteraction,
    Snowflake,
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
    execute: async (interaction: CommandInteraction) => {
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
            // Create promise to return new channel or resolved channel
            let channel: Promise<Channel> = new Promise((resolve, reject) => {
                let channel = interaction.options.get("channel")?.channel;
                if (channel == null) {
                    guild.channels
                        .create({
                            name: "leaderboard",
                            type: ChannelType.GuildText,
                            topic: "The leaderboard for the server.",
                        })
                        .then((newChannel) => {
                            resolve(newChannel);
                        })
                        .catch((err) => {
                            reject(err);
                        });
                } else {
                    if (interaction.guild !== null) {
                        let resolvedChannel =
                            interaction.guild.channels.resolve(channel.id);
                        if (resolvedChannel !== null) {
                            resolve(resolvedChannel);
                        }
                    }
                }
            });

            let channelId: Snowflake = (await channel).id;

            await prisma.guildPrefs.create({
                data: {
                    guildId,
                    channelId,
                },
            });

            await interaction.reply({
                content: `This server has been succesfully set up! Use \`/add\` in that <#${channelId}> to start adding Guardians to be added to the leaderboard.\nYou can also use \`/remove\` to remove players from the leaderboard.\nUse \`/stats\` to display the leaderboard.`,
                ephemeral: true,
            });
            return;
        }
    },
};

export default SetupCommand;

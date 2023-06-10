import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
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
import canvasCreate from "../utils/canvasCreate";
import prisma from "../prisma";
import { set } from "mongoose";

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
        const displayName: string = interaction.options.get("name")?.value + "";
        const code: string = interaction.options.get("code")?.value + "";

        const cleanedDisplayName = displayName
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
            cleanedDisplayName,
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
                content: `User (${cleanedDisplayName}#${code}) does not have public progression on their account.`,
            });

        const data = getHighestCharacterForDestinyPlayer(
            player,
            stats,
            currentSeason,
            record,
            cleanedDisplayName,
            code
        );

        const {
            emblemPath,
            name,
            playerTitle,
            light,
            artifactPower,
            raceClass,
            seasonRank,
            timePlayedHours,
            timePlayedMinutes,
            kdaPVP,
            kdaPVE,
        } = data;

        const attachment = await canvasCreate({
            emblemPath,
            name,
            playerTitle,
            light,
            artifactPower,
            raceClass,
            seasonRank,
            timePlayedHours,
            timePlayedMinutes,
            kdaPVP,
            kdaPVE,
        });

        const yes = new ButtonBuilder()
            .setCustomId("yes")
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success);

        const no = new ButtonBuilder()
            .setCustomId("no")
            .setLabel("No")
            .setStyle(ButtonStyle.Danger);

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            yes,
            no
        );

        const confirmPlayer = await interaction.editReply({
            content: `Is this the correct player?`,
            files: [attachment],
            components: [buttons],
        });

        let addReply: any = await confirmPlayer.awaitMessageComponent({
            filter: (i: any) => i.user.id === interaction.user.id,
            time: 30000,
        });
        if (addReply.customId === "yes") {
            const guildPlayerFromDB = await prisma.guildPlayer.findFirst({
                where: {
                    membershipId,
                },
            });

            if (guildPlayerFromDB) {
                await addReply.reply({
                    content: `Player ${cleanedDisplayName}#${code} is already in the database.`,
                    ephemeral: true,
                });
                interaction.deleteReply();
                return setTimeout(() => addReply.deleteReply(), 5000);
            }

            const addingPlayerToDB = await addReply.reply({
                content: `Adding player ${cleanedDisplayName}#${code} to the database.`,
                ephemeral: true,
            });

            const destinyPlayerFromDB = await prisma.destinyCharacter.findFirst(
                {
                    where: {
                        membershipId,
                    },
                }
            );

            if (!destinyPlayerFromDB) {
                const guildPlayer = await prisma.guildPlayer.create({
                    data: {
                        guildId: interaction.guildId!,
                        membershipType,
                        membershipId,
                        displayName: data.name,
                    },
                });
                const {
                    emblemPath,
                    name,
                    playerTitle,
                    light,
                    artifactPower,
                    raceClass,
                    seasonRank,
                    timePlayedHours,
                    timePlayedMinutes,
                    kdaPVP,
                    kdaPVE,
                    lastPlayed,
                    characterId,
                } = data;
                await prisma.destinyCharacter.create({
                    data: {
                        membershipId,
                        membershipType,
                        emblemPath,
                        name,
                        playerTitle,
                        light,
                        artifactPower,
                        raceClass,
                        seasonRank,
                        timePlayedHours,
                        timePlayedMinutes,
                        kdaPVP,
                        kdaPVE,
                        lastPlayed,
                        characterId,
                    },
                });
            } else if (destinyPlayerFromDB) {
                const {
                    emblemPath,
                    name,
                    playerTitle,
                    light,
                    artifactPower,
                    raceClass,
                    seasonRank,
                    timePlayedHours,
                    timePlayedMinutes,
                    kdaPVP,
                    kdaPVE,
                    lastPlayed,
                    characterId,
                } = data;
                await prisma.destinyCharacter.update({
                    where: {
                        membershipId,
                    },
                    data: {
                        membershipId,
                        membershipType,
                        emblemPath,
                        name,
                        playerTitle,
                        light,
                        artifactPower,
                        raceClass,
                        seasonRank,
                        timePlayedHours,
                        timePlayedMinutes,
                        kdaPVP,
                        kdaPVE,
                        lastPlayed,
                        characterId,
                    },
                });

                await prisma.guildPlayer.create({
                    data: {
                        guildId: interaction.guildId!,
                        membershipType,
                        membershipId,
                        displayName: data.name,
                    },
                });
            }

            await addingPlayerToDB.edit({
                content: `Player ${cleanedDisplayName}#${code} has been added to the database.`,
            });
            interaction.deleteReply();
            setTimeout(() => addReply.deleteReply(), 5000);
        } else if (addReply.customId === "no") {
            addReply.reply({
                content: `The operation has been cancelled.`,
                ephemeral: true,
            });
            interaction.deleteReply();

            setTimeout(() => addReply.deleteReply(), 5000);
        }
    },
    cooldown: 10,
};

export default AddPlayerCommand;

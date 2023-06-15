import {
    getCurrentSeasonPassDefinition,
    getHighestCharacterForDestinyPlayer,
    getPlayerAccountAndCharacterInformation,
    getRecordDefinition,
    getReplyAccountStats,
    searchDestinyPlayer,
} from "../functions";
import prisma from "../prisma";
import canvasCreate from "./canvasCreate";

const leaderboard = async (
    interaction: any,
    guildPrefsChannel: { guildId: string; channelId: string }
) => {
    // Start timer for performance
    let startCount = Date.now();
    let guildId = interaction.guild.id;
    let stats;

    const { channelId } = guildPrefsChannel;

    if (
        channelId === undefined ||
        interaction.guild.channels.resolve(channelId) == null
    ) {
        interaction.reply({
            content: `Bot has not been configured for this server.`,
            ephemeral: true,
        });
        return;
    }

    const leaderboardChannel = interaction.guild.channels.resolve(channelId);

    // Get all the players in the guild
    const guildPlayersFromDB = await prisma.guildPlayer.findMany({
        where: {
            guildId,
        },
        include: {
            destinyCharacter: true,
        },
    });

    if (guildPlayersFromDB.length === 0) {
        leaderboardChannel.send({
            content: `No players found in the database for this server.`,
        });
        return;
    }
    // Clear the channel of all messages
    await leaderboardChannel.bulkDelete(100, true);

    // Send a message to the server that the leaderboard is being generated requested by the user
    if (interaction !== undefined) {
        stats = await leaderboardChannel.send({
            content: `Last updated manually by <@${interaction.user.id}>.`,
        });
    } else {
        stats = await leaderboardChannel.send({
            content: `Generating Leaderboard as scheduled during setup. Please wait...`,
        });
    }

    // Loop through all the players in the guild and update their data if it is older than 15 minutes
    for (let i in guildPlayersFromDB) {
        // Check if the player data is older than 15 mnutes
        if (
            guildPlayersFromDB[i].destinyCharacter.updatedAt <
            new Date(Date.now() - 900000)
        ) {
            console.log("Updating player data", new Date(Date.now() - 1500000));
            const name = guildPlayersFromDB[i].displayName.split("#")[0];
            const code = guildPlayersFromDB[i].displayName.split("#")[1];
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
            const stats = await getReplyAccountStats(
                membershipType,
                membershipId
            );
            const data = getHighestCharacterForDestinyPlayer(
                player,
                stats,
                currentSeason,
                record,
                name,
                code
            );

            await prisma.guildPlayer.update({
                where: {
                    id: guildPlayersFromDB[i].id,
                },
                data: {
                    destinyCharacter: {
                        update: {
                            emblemPath: data.emblemPath,
                            name: data.name,
                            playerTitle: data.playerTitle,
                            light: data.light,
                            artifactPower: data.artifactPower,
                            seasonRank: data.seasonRank,
                            timePlayedHours: data.timePlayedHours,
                            timePlayedMinutes: data.timePlayedMinutes,
                            kdaPVP: data.kdaPVP,
                            kdaPVE: data.kdaPVE,
                            lastPlayed: data.lastPlayed,
                            characterId: data.characterId,
                            raceClass: data.raceClass,

                            updatedAt: new Date(),
                        },
                    },
                },
            });
        }
    }

    // Get all the players in the guild
    const guildPlayers = await prisma.guildPlayer.findMany({
        where: {
            guildId,
        },
        include: {
            destinyCharacter: true,
        },
    });

    // Create the sortable array by light then sort it by base level and then season rank
    let sorted = guildPlayers.sort((a, b) => {
        return a.destinyCharacter.light > b.destinyCharacter.light
            ? -1
            : a.destinyCharacter.light == b.destinyCharacter.light
            ? a.destinyCharacter.light - a.destinyCharacter.artifactPower ==
              b.destinyCharacter.light - b.destinyCharacter.artifactPower
                ? a.destinyCharacter.seasonRank > b.destinyCharacter.seasonRank
                    ? -1
                    : 0
                : 1
            : 1;
    });

    // console.log(sorted);

    // Limit the array to the top 10 players
    let topTen = sorted.slice(0, 10);

    for (let i in topTen) {
        // Build the player card
        let attachment = await canvasCreate(topTen[i].destinyCharacter);

        // Send the player card to the channel
        await leaderboardChannel.send({
            files: [attachment],
        });
    }

    // End timer for performance
    let endCount = Date.now();

    // Update the message to show how long it took to generate the leaderboard
    leaderboardChannel.messages.fetch(stats).then((message: any) => {
        let previousContent = message.content;
        let lastUpdated = Math.floor(
            topTen[0].destinyCharacter.updatedAt.getTime() / 1000 / 60
        );
        let current = Math.floor(Date.now() / 1000 / 60);
        let timeTillNextUpdate = 15 - (current - lastUpdated);

        let lastUpdatedRelative = Math.abs(Math.floor(lastUpdated - current));
        message.edit({
            content: `${previousContent}\nLeaderboard generated in ${
                (endCount - startCount) / 1000
            }s.\nData last updated at ${lastUpdatedRelative} minutes ago\nIf you do not see your most recent stats, please wait ${timeTillNextUpdate} minutes and try again.`,
        });
    });

    console.log(`Leaderboard generated in ${(endCount - startCount) / 1000}s.`);
};

export default leaderboard;

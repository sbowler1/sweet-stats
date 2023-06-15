import chalk from "chalk";
import {
    Guild,
    GuildMember,
    PermissionFlagsBits,
    PermissionResolvable,
    TextChannel,
} from "discord.js";
import GuildDB from "./schemas/Guild";
import { GuildOption } from "./types";
import mongoose from "mongoose";

const _BUNGIE_KEY = process.env.BUNGIE_KEY;

if (typeof _BUNGIE_KEY !== "string") {
    throw new Error("BUNGIE_KEY is not a string or is not defined in .env");
}

const headers = {
    "X-API-Key": _BUNGIE_KEY,
};

const httpOptions = { method: "GET", headers: headers };

type colorType = "text" | "variable" | "error";

const themeColors = {
    text: "#ff8e4d",
    variable: "#ff624d",
    error: "#f5426c",
};

export const getThemeColor = (color: colorType) =>
    Number(`0x${themeColors[color].substring(1)}`);

export const color = (color: colorType, message: any) => {
    return chalk.hex(themeColors[color])(message);
};

export const checkPermissions = (
    member: GuildMember,
    permissions: Array<PermissionResolvable>
) => {
    let neededPermissions: PermissionResolvable[] = [];
    permissions.forEach((permission) => {
        if (!member.permissions.has(permission))
            neededPermissions.push(permission);
    });
    if (neededPermissions.length === 0) return null;
    return neededPermissions.map((p) => {
        if (typeof p === "string") return p.split(/(?=[A-Z])/).join(" ");
        else
            return Object.keys(PermissionFlagsBits)
                .find((k) => Object(PermissionFlagsBits)[k] === p)
                ?.split(/(?=[A-Z])/)
                .join(" ");
    });
};

export const sendTimedMessage = (
    message: string,
    channel: TextChannel,
    duration: number
) => {
    channel
        .send(message)
        .then((m) =>
            setTimeout(
                async () => (await channel.messages.fetch(m)).delete(),
                duration
            )
        );
    return;
};

export const getGuildOption = async (guild: Guild, option: GuildOption) => {
    if (mongoose.connection.readyState === 0)
        throw new Error("Database not connected.");
    let foundGuild: any = await GuildDB.findOne({ guildID: guild.id });
    if (!foundGuild) return null;
    return foundGuild.options[option];
};

export const setGuildOption = async (
    guild: Guild,
    option: GuildOption,
    value: any
) => {
    if (mongoose.connection.readyState === 0)
        throw new Error("Database not connected.");
    let foundGuild = await GuildDB.findOne({ guildID: guild.id });
    if (!foundGuild) return null;
    foundGuild.options[option] = value;
    foundGuild.save();
};

// BUNGIE API CALLS

export const searchDestinyPlayer = async (
    displayName: string,
    code: string
) => {
    const response = await fetch(
        "https://www.bungie.net/Platform/Destiny2/SearchDestinyPlayerByBungieName/-1/",
        {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ displayName, displayNameCode: code }),
        }
    )
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            if (data.Response.length == 0)
                return { error: "No players found." };

            return data.Response[0];
        });

    // if (response.length == 0) return null;

    console.log(response);
    return response;
};

export const getPlayerAccountAndCharacterInformation = async (
    membershipType: string,
    membershipId: string
) => {
    const response = await fetch(
        `https://www.bungie.net/Platform/Destiny2/${membershipType}/Profile/${membershipId}/?components=104,200,202`,
        httpOptions
    )
        .then((r) => r.json())
        .then((j) => j.Response);
    return response;
};

export const getReplyAccountStats = async (
    membershipType: string,
    membershipId: string
) => {
    let response = await fetch(
        `https://www.bungie.net/Platform/Destiny2/${membershipType}/Account/${membershipId}/Stats/`,
        httpOptions
    )
        .then((r) => r.json())
        .then((j) => j.Response);
    return response;
};

export const getCurrentSeasonPassDefinition = async () => {
    return await fetch(
        "https://www.bungie.net/Platform/Destiny2/Manifest/",
        httpOptions
    )
        .then((r) => r.json())
        .then(
            (s) =>
                s.Response.jsonWorldComponentContentPaths.en
                    .DestinySeasonPassDefinition
        )
        .then(async (uri) => {
            return await fetch(
                `https://www.bungie.net${uri}`,
                httpOptions
            ).then((R) => R.json());
        })
        .then((S) => {
            let sortableByIndex = [];
            for (let i in S) {
                sortableByIndex.push([S[i].index, S[i]]);
            }

            let sortedByIndex = sortableByIndex.sort((a, b) => {
                return a[0] - b[0];
            });

            return sortedByIndex[sortedByIndex.length - 1][1];
        });
};

export const getRecordDefinition = async () => {
    return await fetch(
        "https://www.bungie.net/Platform/Destiny2/Manifest/",
        httpOptions
    )
        .then((r) => r.json())
        .then(
            (s) =>
                s.Response.jsonWorldComponentContentPaths.en
                    .DestinyRecordDefinition
        )
        .then(async (uri) => {
            return await fetch(
                `https://www.bungie.net${uri}`,
                httpOptions
            ).then((R) => R.json());
        });
};

// Get Cleaned Player Info

export const getHighestCharacterForDestinyPlayer = (
    player: any,
    stats: any,
    season: any,
    record: any,
    displayName: string,
    code: string
) => {
    // Variable Declarations
    if (!player) {
        console.log(player);
        throw new Error("Player not found.");
    }
    if (!stats) throw new Error("Stats not found.");
    if (!season) throw new Error("Season not found.");
    if (!record) throw new Error("Record not found.");

    let characters = player.characters.data;
    let characterProgressions = player.characterProgressions.data;
    let profileProgressions = player.profileProgression.data;
    let highestCharacter: any;
    let name = displayName + "#" + code;
    const race = ["Human", "Awoken", "Exo"];
    const gClass = ["Titan", "Hunter", "Warlock"];

    // Get Player Highest Character
    let sortableByLight = [];
    for (let i in characters) {
        sortableByLight.push([player.characters.data[i].light, characters[i]]);
        let sortedByLight = sortableByLight.sort((a, b) => {
            return a[0] - b[0];
        });
        highestCharacter = sortedByLight[sortedByLight.length - 1][1];
    }

    // Get Player Emblem
    let emblemPath: string = `https://www.bungie.net${highestCharacter.emblemBackgroundPath}`;

    // Get Player Light
    let light: number = highestCharacter.light;

    // Get artifact power
    let artifactPower: number =
        profileProgressions.seasonalArtifact.powerBonusProgression
            .currentProgress == 0
            ? 0
            : profileProgressions.seasonalArtifact.powerBonus;

    // Get Player Class and race
    let raceClass = `${race[highestCharacter.raceType]} ${
        gClass[highestCharacter.classType]
    }`;

    // Get Player Title
    let playerTitle: string = !highestCharacter.titleRecordHash
        ? "None"
        : record[highestCharacter.titleRecordHash].titleInfo.titlesByGenderHash[
              highestCharacter.genderHash
          ];

    // Get season rank
    let seasonRank: number =
        characterProgressions[highestCharacter.characterId].progressions[
            season.rewardProgressionHash
        ].level +
        characterProgressions[highestCharacter.characterId].progressions[
            season.prestigeProgressionHash
        ].level;

    // time played
    let timePlayedMinutes: number = Math.floor(
        highestCharacter.minutesPlayedTotal % 60
    );
    let timePlayedHours: number = Math.floor(
        highestCharacter.minutesPlayedTotal / 60
    );

    // Get pvpKDA
    let kdaPVP: string = stats.mergedAllCharacters.results.allPvP.allTime
        .killsDeathsAssists.basic
        ? stats.mergedAllCharacters.results.allPvP.allTime.killsDeathsAssists
              .basic.displayValue
        : "0";

    // Get pveKDA
    let kdaPVE: string =
        stats.mergedAllCharacters.results.allPvE.allTime.killsDeathsAssists
            .basic.displayValue;

    return {
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
        lastPlayed: highestCharacter.dateLastPlayed,
        characterId: highestCharacter.characterId,
    };
};

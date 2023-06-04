import chalk from "chalk";
import {
  Guild,
  GuildMember,
  PermissionFlagsBits,
  PermissionResolvable,
  PermissionsBitField,
  TextChannel,
} from "discord.js";
import GuildDB from "./schemas/Guild";
import { GuildOption } from "./types";
import mongoose from "mongoose";
import { stat } from "fs";

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
    if (!member.permissions.has(permission)) neededPermissions.push(permission);
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
  let foundGuild = await GuildDB.findOne({ guildID: guild.id });
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
    .then((r) => r.json())
    .then((p) => {
      let crossSavePlayer = {};
      if (p.Response.length == 1) return p.Response;

      // Check if cross-save override exists on membership
      if (!p.Response[0].crossSaveOverride) {
        console.log("User does not have cross-save enabled");
        return p.Response[0];
      }

      for (let i in p.Response) {
        if (p.Response[i].crossSaveOverride == p.Response[i].membershipType) {
          crossSavePlayer = p.Response[i];
        }
      }

      return crossSavePlayer;
    });

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
        s.Response.jsonWorldComponentContentPaths.en.DestinySeasonPassDefinition
    )
    .then(async (uri) => {
      return await fetch(`https://www.bungie.net${uri}`, httpOptions).then(
        (R) => R.json()
      );
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
        s.Response.jsonWorldComponentContentPaths.en.DestinyRecordDefinition
    )
    .then(async (uri) => {
      return await fetch(`https://www.bungie.net${uri}`, httpOptions).then(
        (R) => R.json()
      );
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
  let emblemPath = highestCharacter.emblemBackgroundPath;

  // Get Player Light
  let light = highestCharacter.light;

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
  let playerTitle = !highestCharacter.titleRecordHash
    ? "None"
    : record[highestCharacter.titleRecordHash].titleInfo.titlesByGenderHash[
        highestCharacter.genderHash
      ];

  // Get season rank
  let seasonRank =
    characterProgressions[highestCharacter.characterId].progressions[
      season.rewardProgressionHash
    ].level +
    characterProgressions[highestCharacter.characterId].progressions[
      season.prestigeProgressionHash
    ].level;

  // time played
  let timePlayedMinutes = Math.floor(highestCharacter.minutesPlayedTotal % 60);
  let timePlayedHours = Math.floor(highestCharacter.minutesPlayedTotal / 60);

  // Get pvpKDA
  let kdaPVP = stats.mergedAllCharacters.results.allPvP.allTime
    .killsDeathsAssists.basic
    ? stats.mergedAllCharacters.results.allPvP.allTime.killsDeathsAssists.basic
        .displayValue
    : 0;

  // Get pveKDA
  let kdaPVE =
    stats.mergedAllCharacters.results.allPvE.allTime.killsDeathsAssists.basic
      .displayValue;

  return {
    emblemPath,
    name,
    playerTitle,
    light,
    artifactPower,
    raceClass,
    seasonRank,
    stats: {
      timePlayedHours,
      timePlayedMinutes,
      kdaPVP,
      kdaPVE,
    },
  };
};

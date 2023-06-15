import { ChannelType, GuildMember } from "discord.js";
import { BotEvent } from "../types";

const event: BotEvent = {
    name: "guildMemberRemove",
    execute: async (member: GuildMember) => {
        // Send message to the channel
        const channel = member.guild.channels.cache.find(
            (channel) => channel.name === "general"
        );
        if (!channel) return;

        if (channel.type === ChannelType.GuildText) {
            channel.send(`Goodbye, ${member.nickname}!`);
        }

        // Get the player's data from the database

        // Remove the member from the database
        // const guild = await GuildDB.findOne({ guildID: member.guild.id });
        // if (!guild) return;
        // const memberIndex = guild.members.findIndex(
        //     (m) => m.userID === member.id
        // );
        // if (memberIndex === -1) return;
        // guild.members.splice(memberIndex, 1);
        // guild.save();
    },
};

export default event;

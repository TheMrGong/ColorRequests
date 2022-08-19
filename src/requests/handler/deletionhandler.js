//@ts-check

const Discord = require("discord.js")

import requestStore from "../requeststore"

/**
 * @param {Discord.Snowflake} guildId
 * @param {...ColorRequest} colorRequests 
 */
async function handleDeletion(guildId, ...colorRequests) {
    if (colorRequests.length == 1) {
        const deleting = colorRequests[0]
        await requestStore.removeRequest(guildId, deleting.requester)
    } else
        await requestStore.removeMultipleRequests(guildId, ...colorRequests.map(it => it.requester))
}

/**
 * @param {Discord.Message | Discord.PartialMessage | Discord.Collection<string, Discord.Message | Discord.PartialMessage> | Discord.Channel | Discord.PartialChannelData} deleted
 */
export default async function (deleted) {
    let deleting = []

    let guildId;

    
    if (deleted instanceof Discord.Message) {
        const colorRequest = await requestStore.findRequestByMessage(deleted)
        if (colorRequest) deleting.push(colorRequest)
        guildId = deleted.guild.id
    }
    else if (deleted instanceof Discord.TextChannel) {
        deleting = (await requestStore.getGuildPending(deleted.guild.id)).filter(it => it.pendingMessage.channelId == deleted.id)
        guildId = deleted.guild.id
    } else if (deleted instanceof Discord.Collection) { // bulk delete
        if (deleted.size > 0) {
            for(const [_, msg] of deleted.entries()) {
                const colorRequest = await requestStore.findRequestByMessage(msg)
                if (colorRequest) deleting.push(colorRequest)
            }
            guildId = deleted.first().guild.id
        }
    } else throw new Error(`Unknown event with deleted type: ${deleted}`)
    if (deleting.length > 0) handleDeletion(guildId, ...deleting)
}
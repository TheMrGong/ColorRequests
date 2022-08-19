//@ts-check

const Discord = require("discord.js")
const rgbUtil = require("../util/rgbutil")

import bot from "../bot"
import db from "./requestdb"

import { UserContext } from "../util/discordutil"

// key is guild id
/**@type {Object.<string, ColorRequest[]>} **/
const colorRequests = {}

/**
 * @param {UserContext} requestingMessage 
 * @param {Discord.Message} requestMessage Associated message to request
 * @param {rgbUtil.RGBColor} requestingColor 
 */
async function registerNewRequest(requestingMessage, requestMessage, requestingColor) {
    const requests = await getGuildPending(requestingMessage.guild.id)
    const colorRequest = {
        requester: requestingMessage.member.user.id,
        pendingMessage: {
            channelId: requestMessage.channel.id,
            messageId: requestMessage.id
        },
        requestedColor: requestingColor
    }
    requests.push(colorRequest)
    await db.registerNewRequest(requestingMessage.guild.id, colorRequest)
}

/**
 * @param {Discord.Snowflake} guildId 
 * @returns {Promise<ColorRequest[]>}
 */
async function getGuildPending(guildId) {
    const pendingRequests = colorRequests[guildId]
    if (pendingRequests) return pendingRequests
    const updatedRequests = await filterValidRequests(guildId, await db.getGuildRequests(guildId))
    colorRequests[guildId] = updatedRequests
    return updatedRequests
}

/**
 * Removes requests that are no longer existing while the bot was down
 * (their channel was deleted or messsage was deleted) 
 * 
 * @param {ColorRequest[]} requests 
 * @returns {Promise<ColorRequest[]>}
 */
async function filterValidRequests(guildId, requests) {


    const guild = await bot.client.guilds.fetch(guildId)

    if (!guild) { // guild is now gone
        await removeMultipleRequests(guildId, ...requests.map(it => it.requester))
        return []
    }

    /**@type {ColorRequest[]} */
    const invalidRequests = []
    /**@type {ColorRequest[]} */
    const validRequests = []


    for (let k in requests) {
        const request = requests[k]

        const channel = guild.channels.cache.get(guild.channels.resolveId(request.pendingMessage.channelId))
        if (!(channel instanceof Discord.TextChannel)) { // channel no longer exists
            invalidRequests.push(request)
            console.log(`Couldn't find channel for pending request, invalidating - ${channel}, ${request.pendingMessage.channelId}`)
            continue
        }
        let message;
        try {
            message = await channel.messages.fetch(request.pendingMessage.messageId)
        } catch (e) { }
        if (!message) {
            invalidRequests.push(request)
            console.log(`Couldn't find message ${request.pendingMessage.messageId} in channel #${channel.name} invalidating`)
        }
        else {
            validRequests.push(request)
        }
    }

    const invalids = invalidRequests.map(it => it.requester)
    if (invalids.length > 0) {
        console.log("Found " + invalids.length + " invalid request(s) for guild " + guild.name)
        if (invalids.length > 1) await db.multiDeleteRequests(guildId, ...invalids)
        else await db.deleteRequest(guildId, invalids[0])
    }
    return validRequests
}

/**
 * @param {Discord.Snowflake} guildId 
 * @param {Discord.Snowflake} userId 
 */
async function removeRequest(guildId, userId) {
    const requests = (await getGuildPending(guildId)).filter(it => it.requester != userId)
    colorRequests[guildId] = requests
    await db.deleteRequest(guildId, userId)
}

/**
 * @param {Discord.Snowflake} guildId 
 * @param {...Discord.Snowflake} userIds 
 */
async function removeMultipleRequests(guildId, ...userIds) {
    const requests = (await getGuildPending(guildId)).filter(it => userIds.filter(u => u == it.requester).length == 0)
    colorRequests[guildId] = requests
    await db.multiDeleteRequests(guildId, ...userIds)
}

/**
 * @param {Discord.Snowflake} guildId 
 * @param {Discord.Snowflake} userId 
 * @returns {Promise<boolean>}
 */
async function hasPendingRequest(guildId, userId) {
    const requests = await getGuildPending(guildId)

    return requests.filter(it => it.requester == userId).length > 0
}

/**
 * @param {Discord.Message | Discord.PartialMessage} message 
 * @returns {Promise<null | ColorRequest>}
 */
async function findRequestByMessage(message) {
    const found = (await getGuildPending(message.guild.id)).filter(it => it.pendingMessage.messageId == message.id)
    if (found.length == 0) return null
    return found[0]
}

export default {
    getGuildPending,
    registerNewRequest,
    hasPendingRequest,
    removeRequest,
    removeMultipleRequests,
    findRequestByMessage
}
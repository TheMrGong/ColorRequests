//@ts-check

const Discord = require("discord.js")
const rgbUtil = require("../util/rgbutil")

const client = require("../bot").client
const db = require("./requestdb")

// key is guild id
/**@type {Object.<string, ColorRequest[]>} **/
const colorRequests = {}

/**
 * @typedef ColorRequest
 * @property {string} requester Discord id of requester
 * @property {PendingMessage} pendingMessage Discord ID of pending message
 * @property {rgbUtil.RGBColor} requestedColor Object for color requested
 */

/**
 * @typedef PendingMessage
 * @property {string} channelId 
 * @property {string} messageId 
 */

/**
 * @param {Discord.Message} requestingMessage 
 * @param {Discord.Message} requestMessage Associated message to request
 * @param {rgbUtil.RGBColor} requestingColor 
 */
async function registerNewRequest(requestingMessage, requestMessage, requestingColor) {
    const requests = await getGuildPending(requestingMessage.guild.id)
    const colorRequest = {
        requester: requestingMessage.author.id,
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
 * @param {string} guildId 
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


    const guild = client.guilds.get(guildId)

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

        const channel = guild.channels.get(request.pendingMessage.channelId)
        if (!(channel instanceof Discord.TextChannel)) { // channel no longer exists
            invalidRequests.push(request)
            continue
        }
        let message;
        try {
            message = await channel.fetchMessage(request.pendingMessage.messageId)
        } catch (e) { }
        if (!message) invalidRequests.push(request)
        else validRequests.push(request)
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
 * @param {string} guildId 
 * @param {string} userId 
 */
async function removeRequest(guildId, userId) {
    const requests = (await getGuildPending(guildId)).filter(it => it.requester != userId)
    colorRequests[guildId] = requests
    await db.deleteRequest(guildId, userId)
}

/**
 * @param {string} guildId 
 * @param {...string} userIds 
 */
async function removeMultipleRequests(guildId, ...userIds) {
    const requests = (await getGuildPending(guildId)).filter(it => userIds.filter(u => u == it.requester).length == 0)
    colorRequests[guildId] = requests
    await db.multiDeleteRequests(guildId, ...userIds)
}

/**
 * @param {string} guildId 
 * @param {string} userId 
 * @returns {Promise<boolean>}
 */
async function hasPendingRequest(guildId, userId) {
    const requests = await getGuildPending(guildId)

    return requests.filter(it => it.requester == userId).length > 0
}

/**
 * @param {Discord.Message} message 
 * @returns {Promise<null | ColorRequest>}
 */
async function findRequestByMessage(message) {
    const found = (await getGuildPending(message.guild.id)).filter(it => it.pendingMessage.messageId == message.id)
    console.log("Found: " + found.length)
    if (found.length == 0) return null
    return found[0]
}

module.exports = {
    getGuildPending,
    registerNewRequest,
    hasPendingRequest,
    removeRequest,
    removeMultipleRequests,
    findRequestByMessage
}
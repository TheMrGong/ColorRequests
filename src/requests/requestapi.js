//@ts-check
const Discord = require("discord.js")
const guildConfigs = require("../guildconfig/guildconfigs")

const config = require("../config")
const requestDB = require("./requestdb")
const requestStore = require("./requeststore")

const rgbUtil = require("../util/rgbutil")

const ACCEPT_EMOJI = "✅"
const DECLINE_EMOJI = "⛔"

/**
 * @param {Discord.Message} requestingMessage 
 * @param {rgbUtil.RGBColor} requestingColor 
 */
async function createNewRequest(requestingMessage, requestingColor) {
    let configChannel = (await guildConfigs.getGuildConfig(requestingMessage.guild.id)).requestChannelId

    /**@type {Discord.TextChannel} */
    let requestChannelToUse;
    if (!configChannel) {
        //@ts-ignore
        requestChannelToUse = requestingMessage.channel
    }
    else { // make sure the channel set in config still exists
        const foundChannel = requestingMessage.guild.channels.get(configChannel)
        if (foundChannel instanceof Discord.TextChannel) requestChannelToUse = foundChannel
        else { // config is set to a channel that has been removed
            //@ts-ignore
            requestChannelToUse = requestingMessage.channel

            // update config to reflect invalid channel
            guildConfigs.setGuildRequestChannel(requestingMessage.id, null)
        }
    }
    let member = requestingMessage.member
    if (!member) member = await requestingMessage.guild.fetchMember(requestingMessage.author)
    const requestMessage = await generateRequestMessage(requestChannelToUse, member, requestingColor)
    await requestStore.registerNewRequest(requestingMessage, requestMessage, requestingColor)
}

/**
 * @param {Discord.Message} requestingMessage 
 * @param {boolean} accepting 
 * @param {requestStore.ColorRequest} colorRequest 
 */
async function handleAcceptOrDeny(requestingMessage, accepting, colorRequest) {
    await requestStore.removeRequest(requestingMessage.guild.id, colorRequest.requester)
    await requestingMessage.delete()
    console.log("Got an " + (accepting ? "accept" : "deny") + " for a color request")
}

/**
 * @param {Discord.Message} requestingMessage 
 * @param {rgbUtil.RGBColor} requestingColor
 */
async function handleNewRequest(requestingMessage, requestingColor) {
    try {
        const hasExisting = await requestStore.hasPendingRequest(requestingMessage.guild.id, requestingMessage.author.id)
        if (hasExisting) { // don't let them make additional requests
            const errorMessage = (await requestingMessage.channel.send("You already have a pending color request."))
            if (errorMessage instanceof Discord.Message)
                errorMessage.delete(config.deleteMessagesAfter)
            return
        }
        await createNewRequest(requestingMessage, requestingColor)
        requestingMessage.channel.send("Generated a color request.")
        console.log("[+] Created new color request for " + requestingMessage.author.username)
    } catch (e) {
        console.error(e)
        requestingMessage.channel.send("Error occurred generating request.")
    }
}

/**
 * @param {Discord.Message} message The message allowing admins to accept or deny
 * @param {requestStore.ColorRequest} colorRequest 
 */
async function handleCancel(message, colorRequest) {
    await requestStore.removeRequest(message.guild.id, colorRequest.requester)
    await message.delete()
    console.log("[\\] Color request from " + colorRequest.requester + " cancelled")
}

/**
 * @param {Discord.TextChannel} channel 
 * @param {Discord.GuildMember} requester 
 * @param {rgbUtil.RGBColor} requestingColor 
 * @returns {Promise<Discord.Message>}
 */
async function generateRequestMessage(channel, requester, requestingColor) {
    let text = requester.displayName + ` is requesting for the color Red[${requestingColor.r}] Green[${requestingColor.g}] Blue[${requestingColor.b}]`
    text += `\n${ACCEPT_EMOJI} to accept, ${DECLINE_EMOJI} to deny`
    const message = await channel.send(text)

    if (message instanceof Discord.Message) {
        message.react(ACCEPT_EMOJI).then(() => message.react(DECLINE_EMOJI))

        return message
    }
    else return message[0]
}

/**
 * 
 * @param {Discord.Client} client 
 */
async function setup(client) {
    client.on("messageReactionAdd", require("./handler/reactionhandler"))
    client.on("message", require("./handler/messagehandler"))

    const deletionHandler = require("./handler/deletionhandler")
    client.on("messageDelete", deletionHandler)
    client.on("messageDeleteBulk", deletionHandler)
    client.on("channelDelete", deletionHandler)
    return requestDB.ready
}

module.exports = {
    setup,
    createNewRequest,
    handleAcceptOrDeny,
    handleNewRequest,
    handleCancel,
    ACCEPT_EMOJI,
    DECLINE_EMOJI
}
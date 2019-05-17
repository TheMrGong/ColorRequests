//@ts-check
const Discord = require("discord.js")
const guildConfigs = require("../guildconfig/guildconfigs")

const config = require("../config")
const requestDB = require("./requestdb")
const requestStore = require("./requeststore")

const rgbUtil = require("../util/rgbutil")

const roleApi = require("../colorroles/roleapi")
const roleStore = require("../colorroles/rolestore")

const requestImages = require("./requestimages")

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

    const existingRole = await roleStore.getColorRole(requestingMessage.guild.id, requestingMessage.author.id)

    const requestMessage = await (existingRole ? generateEditMessage(requestChannelToUse, member, requestingColor)
        : generateRequestMessage(requestChannelToUse, member, requestingColor))
    await requestStore.registerNewRequest(requestingMessage, requestMessage, requestingColor)
}

/**
 * 
 * @param {Discord.Message} requestingMessage 
 * @param {Discord.GuildMember} member
 * @param {rgbUtil.RGBColor} color 
 * @returns {Promise<boolean>} Whether it was a change or a new role [true = new role]
 */
async function doAccept(requestingMessage, member, color) {
    const existingRole = await roleStore.getColorRole(requestingMessage.guild.id, member.user.id)
    if (!existingRole) {
        try {
            await roleApi.createColorRole(requestingMessage.guild.id, member.user.username + "'s Color Role", member.user.id, color)
        } catch (e) {
            requestingMessage.channel.send("Unable to grant you the role. Missing permissions?")
            console.error("Failed to grant color role to " + member.displayName)
            console.error(e)
            return
        }
        return true
    } else { // editing their existing role
        await roleApi.changeColorRoleColor(requestingMessage.guild.id, member.user.id, color)
        return false
    }
}

/**
 * @param {Discord.Message} requestingMessage 
 * @param {boolean} accepting 
 * @param {requestStore.ColorRequest} colorRequest 
 */
async function handleAcceptOrDeny(requestingMessage, accepting, colorRequest) {
    await requestStore.removeRequest(requestingMessage.guild.id, colorRequest.requester)
    await requestingMessage.delete()

    const user = await requestingMessage.client.fetchUser(colorRequest.requester)
    const member = await requestingMessage.guild.fetchMember(user)


    if (accepting) {
        if (await doAccept(requestingMessage, member, colorRequest.requestedColor))
            requestingMessage.channel.send("Granted a color role to " + member.user.toString() + "! Congratulations!")
        else requestingMessage.channel.send(`Changed ${member.user.toString()}'s username color!`)
        console.log("[/] Accepted a color request")
    } else console.log("[X] Declined a color request")
}

/**
 * @param {Discord.Message} requestingMessage 
 * @param {rgbUtil.RGBColor} requestingColor
 */
async function handleNewRequest(requestingMessage, requestingColor) {
    try {
        let member = requestingMessage.member
        if (!member) member = await requestingMessage.guild.fetchMember(requestingMessage.author)

        const hasAcceptRole = await guildConfigs.memberHasAcceptRole(member)
        if (hasAcceptRole) {
            if (await doAccept(requestingMessage, member, requestingColor))
                requestingMessage.channel.send("Gave you a new role, enjoy your color " + member.user.toString() + "!")
            else requestingMessage.channel.send("Updated your color, enjoy " + member.user.toString() + "!")
            if (requestingMessage.deletable) requestingMessage.delete()
            return
        }
        const hasExisting = await requestStore.hasPendingRequest(requestingMessage.guild.id, requestingMessage.author.id)
        if (hasExisting) { // don't let them make additional requests
            const errorMessage = (await requestingMessage.channel.send("You already have a pending color request."))
            if (errorMessage instanceof Discord.Message)
                errorMessage.delete(config.deleteMessagesAfter)
            return
        }
        await createNewRequest(requestingMessage, requestingColor)
        if (requestingMessage.deletable) requestingMessage.delete()
        requestingMessage.channel.send("Color requested, waiting for admin response")
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
    const image = await requestImages.generateChangeImage(requester.displayName, requester.user.displayAvatarURL, "#" + requestingColor.hexColor())
    const message = await channel.send(new Discord.Attachment(image, "display.gif"))

    if (message instanceof Discord.Message) {
        message.react(ACCEPT_EMOJI).then(() => message.react(DECLINE_EMOJI))

        return message
    }
    else return message[0]
}

/**
 * @param {Discord.TextChannel} channel 
 * @param {Discord.GuildMember} requester 
 * @param {rgbUtil.RGBColor} changingColor
 * @returns {Promise<Discord.Message>}
 */
async function generateEditMessage(channel, requester, changingColor) {
    const image = await requestImages.generateChangeImage(requester.displayName, requester.user.displayAvatarURL, "#" + changingColor.hexColor())
    const message = await channel.send(new Discord.Attachment(image, "display.gif"))

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

    const guilds = client.guilds.array()
    for (let k in guilds) // pre-cache all current guilds
        await requestStore.getGuildPending(guilds[k].id)
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
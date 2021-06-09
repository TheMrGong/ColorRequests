//@ts-check
const Discord = require("discord.js")
import guildConfigs from "../guildconfig/guildconfigs"

const requestDB = require("./requestdb")
import requestStore from "./requeststore"

const rgbUtil = require("../util/rgbutil")

import roleApi from "../colorroles/roleapi"
import roleStore from "../colorroles/rolestore"

import requestImages from "./requestimages"
const colorAliases = require("../guildconfig/coloralias/coloraliasapi")
import discordUtil, { idToFlake, UserContext } from "../util/discordutil"

import { createGroupedRole, findGroupedRole, removeGroupedRole, findGroupRoles, handleLossRole } from "../groupedroles"

import reactionHandler from "./handler/reactionhandler"
import messageHandler from "./handler/messagehandler"
import deletionHandler from "./handler/deletionhandler"
import interactionHandler from "./handler/interactionhandler"

const ACCEPT_EMOJI = "✅"
const DECLINE_EMOJI = "⛔"

/**
 * @param {UserContext} requestingMessage 
 * @param {rgbUtil.RGBColor} requestingColor 
 */
async function createNewRequest(requestingMessage, requestingColor) {
    let configChannel = idToFlake((await guildConfigs.getGuildConfig(requestingMessage.guild.id)).requestChannelId)

    /**@type {Discord.TextChannel} */
    let requestChannelToUse;
    if (!configChannel) {
        //@ts-ignore
        requestChannelToUse = requestingMessage.channel
    }
    else { // make sure the channel set in config still exists
        const foundChannel = requestingMessage.guild.channels.cache.get(configChannel)
        if (foundChannel instanceof Discord.TextChannel) requestChannelToUse = foundChannel
        else { // config is set to a channel that has been removed
            //@ts-ignore
            requestChannelToUse = requestingMessage.channel

            // update config to reflect invalid channel
            guildConfigs.setGuildRequestChannel(requestingMessage.guild.id, null)
        }
    }
    let member = requestingMessage.member
    if (!member) member = await requestingMessage.guild.members.fetch(requestingMessage.member.user)

    const existingRole = await roleStore.getColorRole(requestingMessage.guild.id, requestingMessage.member.user.id)

    const requestMessage = await (existingRole ? generateEditMessage(requestChannelToUse, member, requestingColor)
        : generateRequestMessage(requestChannelToUse, member, requestingColor))
    await requestStore.registerNewRequest(requestingMessage, requestMessage, requestingColor)
}

/**
 * 
 * @param {UserContext} requestingMessage 
 * @param {Discord.GuildMember} member
 * @param {rgbUtil.RGBColor} color 
 * @returns {Promise<boolean>} Whether it was a change or a new role [true = new role]
 */
async function doAccept(requestingMessage, member, color) {
    const existingRole = await roleStore.getColorRole(requestingMessage.guild.id, member.user.id)

    // check if they're trying to change their color to same one
    if(existingRole) {
        const role = await member.guild.roles.fetch(existingRole.roleId)
        if(role && role.hexColor.substring(1) === color.hexColor()) {
            return false
        }
    }

    const groupRoleForColor = await findGroupedRole(requestingMessage.guild.id, color.hexColor())

    const oldGroupRoles = (await findGroupRoles(member)).filter(it => !groupRoleForColor || it.id != groupRoleForColor.getRoleId())
    if (oldGroupRoles.length > 0) {
        await member.roles.remove(oldGroupRoles)
        await handleLossRole(member, oldGroupRoles)
    }

    if (groupRoleForColor) {
        const groupRole = await requestingMessage.guild.roles.fetch(groupRoleForColor.getRoleId())
        if(!groupRole) {
            await removeGroupedRole(requestingMessage.guild.id, groupRoleForColor.getRoleId())
            console.log(`Failed to find group role in guild when existed in DB, deleting`)
        } else {
            if (existingRole)
            await roleApi.removeColorRole(member.guild.id, member.user.id)
            await member.roles.add(groupRole)
            return true
        }
    }
    // ensure roles are up to date before interacting with roles
    await member.guild.roles.fetch()

    const rolesWithColor = await roleStore.getRolesWithColor(member.guild.id, color.hexColor())
    if (rolesWithColor.length + 1 >= 2) {
        if (existingRole) {
            await mergeSameColorRoles(requestingMessage.guild, [existingRole, ...rolesWithColor], color)
        } else {
            const groupRole = await mergeSameColorRoles(requestingMessage.guild, rolesWithColor, color)
            const highestColorCurrently = discordUtil.findHighestColorPriority(member) + 1
            if (groupRole.position < highestColorCurrently) {
                try {
                    await groupRole.setPosition(highestColorCurrently, { relative: false })
                } catch (e) {
                    console.error("Unable to change group role to match " + member.displayName + "'s highest color", e)
                }
            }
            await member.roles.add(groupRole)
        }
        return true
    }

    if (!existingRole) {
        try {
            await roleApi.createColorRole(requestingMessage.guild.id, member.user.username + "'s Color Role", member.user.id, color)
        } catch (e) {
            requestingMessage.sendMessage("Unable to grant you the role. Missing permissions?")
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
 * @param {Discord.Guild} guild
 * @param {ColorRole[]} sameRoles 
 * @param {RGBColor} color
 * @returns {Promise<Discord.Role>} if initiator was able to get their role
 */
async function mergeSameColorRoles(guild, sameRoles, color) {
    const alias = (await colorAliases.getColorAliases(guild.id)).find(it => it.color.hexColor() == color.hexColor())
    const name = alias ? "Grouped " + alias.name : "Grouped #" + color.hexColor()

    const existingGroupedRole = await findGroupedRole(guild.id, color.hexColor())
    let role;
    if (existingGroupedRole)
        role = guild.roles.cache.get(existingGroupedRole.getRoleId())
    if (!role) role = await createGroupedRole(guild.id, color, name)

    let highestPosition = 0

    await roleApi.removeMultipleColorRoles(guild.id, ...sameRoles)
    for (let colorRole of sameRoles) {
        try {
            const owner = await guild.members.fetch(colorRole.roleOwner)
            const highestPriority = discordUtil.findHighestColorPriority(owner)
            if (highestPriority > highestPosition)
                highestPosition = highestPriority
            await owner.roles.add(role)
        } catch (e) {
            console.warn("Unable to give color role for " + colorRole.roleOwner, e)
        }
    }

    if (highestPosition != 0) {
        try {
            // ensure roles up to date before trying to resort
            await role.guild.roles.fetch()
            role = await role.setPosition(highestPosition + 1, { relative: false })
        } catch (e) {
            console.warn("Failed to update group role position", e)
        }
    }
    return role
}

/**
 * @param {Discord.Message} requestingMessage 
 * @param {boolean} accepting 
 * @param {ColorRequest} colorRequest 
 */
async function handleAcceptOrDeny(requestingMessage, accepting, colorRequest) {
    await requestStore.removeRequest(requestingMessage.guild.id, colorRequest.requester)
    await requestingMessage.delete()

    const user = await requestingMessage.client.users.fetch(colorRequest.requester)
    const member = await requestingMessage.guild.members.fetch(user)


    if (accepting) {
        if (await doAccept(await UserContext.ofMessage(requestingMessage), member, colorRequest.requestedColor))
            requestingMessage.channel.send("Granted a color role to " + member.user.toString() + "! Congratulations!")
        else requestingMessage.channel.send(`Changed ${member.user.toString()}'s username color!`)
        console.log("[/] Accepted a color request")
    } else console.log("[X] Declined a color request")
}

/**
 * @param {UserContext} requestingMessage 
 * @param {rgbUtil.RGBColor} requestingColor
 */
async function handleNewRequest(requestingMessage, requestingColor) {
    try {
        let member = requestingMessage.member
        if (!member) member = await requestingMessage.guild.members.fetch(requestingMessage.member.user)

        if(!(await guildConfigs.memberCanChangeColor(member))) {
            const changeRoles = (await guildConfigs.getGuildConfig(member.guild.id)).acceptedChangeRoles
            .map(roleId => member.guild.roles.cache.get(roleId))
            .filter(it => it !== undefined)
            .map(it => it.name)
            .join(", ")
            await requestingMessage.sendMessage("You need one of the following roles: ("+changeRoles+") to change your color")
            return
        }
        const hasAcceptRole = await guildConfigs.memberHasAcceptRole(member)
        const isPreapproved = await guildConfigs.isPreapprovedColor(requestingMessage.guild.id, requestingColor)
        if (hasAcceptRole || isPreapproved) {
            const result = await doAccept(requestingMessage, member, requestingColor)
            if(result === undefined) return
            if (result) {
                console.log(`[!] Created new role for ${member.user.username}`)
                await requestingMessage.sendMessage("Gave you a new role, enjoy your color " + member.user.toString() + "!")
            }
            else {
                console.log(`[~] Updated color for ${member.user.username}`)
                await requestingMessage.sendMessage("Updated your color, enjoy " + member.user.toString() + "!")
            }

            return
        }
        const hasExisting = await requestStore.hasPendingRequest(requestingMessage.guild.id, requestingMessage.member.user.id)
        if (hasExisting) { // don't let them make additional requests
            await requestingMessage.sendMessage("You already have a pending color request.")
            return
        }
        await createNewRequest(requestingMessage, requestingColor)
        await requestingMessage.delete()
        await requestingMessage.sendMessage("Color requested, waiting for admin response")
        console.log("[+] Created new color request for " + requestingMessage.member.user.username)
    } catch (e) {
        console.error(e)
        requestingMessage.sendMessage("Error occurred generating request.").catch((e) => {
            console.error(`Failed to show generating request`)
            console.error(e)
        })
    }
}

/**
 * @param {Discord.Message} message The message allowing admins to accept or deny
 * @param {ColorRequest} colorRequest 
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
    const image = await requestImages.generateChangeImage(requester.displayName, requester.user.displayAvatarURL(), "#" + requestingColor.hexColor())
    const message = await channel.send(new Discord.MessageAttachment(image, "display.gif"))

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
    const image = await requestImages.generateChangeImage(requester.displayName, requester.user.displayAvatarURL(), "#" + changingColor.hexColor())
    const message = await channel.send(new Discord.MessageAttachment(image, "display.gif"))

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
    client.on("messageReactionAdd", reactionHandler)
    client.on("message", messageHandler)
    
    client.on("messageDelete", deletionHandler)
    client.on("messageDeleteBulk", deletionHandler)
    client.on("channelDelete", deletionHandler)
    client.on("interaction", interactionHandler)

    const guilds = client.guilds.cache.array()
    for (let k in guilds) // pre-cache all current guilds
        await requestStore.getGuildPending(guilds[k].id)
    //@ts-ignore
    return requestDB.ready
}

export default {
    setup,
    createNewRequest,
    handleAcceptOrDeny,
    handleNewRequest,
    handleCancel,
    findGroupedRole,
    mergeSameColorRoles,
    ACCEPT_EMOJI,
    DECLINE_EMOJI
}
export {
    setup,
    createNewRequest,
    handleAcceptOrDeny,
    handleNewRequest,
    handleCancel,
    findGroupedRole,
    ACCEPT_EMOJI,
    DECLINE_EMOJI,
    mergeSameColorRoles
}
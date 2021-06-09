//@ts-check

const Discord = require("discord.js")

const requestApi = require("../requestapi")
import requestStore from "../requeststore"

const guildConfig = require("../../guildconfig/guildconfigs")

/**
 * 
 * @param {Discord.MessageReaction} reaction 
 * @param {Discord.User | Discord.PartialUser} user 
 */
export default async (reaction, user) => {
    const accepting = reaction.emoji.toString() == requestApi.ACCEPT_EMOJI

    if (user.bot) return
    if (!accepting && reaction.emoji.toString() != requestApi.DECLINE_EMOJI) return // wasn't an emoji accepting or denying

    const colorRequest = await requestStore.findRequestByMessage(reaction.message)
    if (!colorRequest) return // no associated color request to this message

    const member = await reaction.message.guild.members.fetch(user.id)

    if (user.id == colorRequest.requester && !accepting) // allow user to cancel their own color request
        requestApi.handleCancel(reaction.message, colorRequest)
    else if (await guildConfig.memberHasPermissionToAccept(member)) {
        requestApi.handleAcceptOrDeny(reaction.message, accepting, colorRequest)
    }
}
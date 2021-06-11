//@ts-check

const Discord = require("discord.js")

import requestApi from "../requestapi"
import requestStore from "../requeststore"

import guildConfig from "../../guildconfig/guildconfigs"

/**
 * 
 * @param {Discord.MessageReaction} reaction 
 * @param {Discord.User | Discord.PartialUser} user 
 */
export default async (reaction, user) => {
    let reactionMessage = reaction.message
    if(!(reactionMessage instanceof Discord.Message)) {
        reactionMessage = await reaction.message.channel.messages.resolve(reactionMessage.id)
    }
    const accepting = reaction.emoji.toString() == requestApi.ACCEPT_EMOJI

    if (user.bot) return
    if (!accepting && reaction.emoji.toString() != requestApi.DECLINE_EMOJI) {
        return // wasn't an emoji accepting or denying
    }

    const colorRequest = await requestStore.findRequestByMessage(reaction.message)
    if (!colorRequest) return // no associated color request to this message

    const member = await reaction.message.guild.members.fetch(user.id)

    if (user.id == colorRequest.requester && !accepting) // allow user to cancel their own color request
        requestApi.handleCancel(reactionMessage, colorRequest)
    else if (await guildConfig.memberHasPermissionToAccept(member)) {
        requestApi.handleAcceptOrDeny(reactionMessage, accepting, colorRequest)
    }
}
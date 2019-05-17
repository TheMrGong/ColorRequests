//@ts-check

const Discord = require("discord.js")
const hexToRgb = require("../../util/rgbutil")
const config = require("../../config")

const guildConfig = require('../../guildconfig/guildconfigs')

const requestApi = require("../requestapi")
const colorAlias = require("../../guildconfig/coloralias/coloraliasapi")
const requestImages = require("../requestimages")

const CONFIG_PERM = "MANAGE_ROLES_OR_PERMISSIONS"

/**
* 
* @param {Discord.Message} message 
*/
module.exports = async (message) => {

    if (!message.content.startsWith(config.prefix)) return;

    const spaces = message.content.split(" ");
    const cmd = spaces[0].toLowerCase().substring(1, spaces[0].length).replace(/[^\w]/gm, "")
    const args = [];
    for (let k in spaces) {
        if (parseInt(k) > 0) args.push(spaces[k]);
    }

    let member = message.member
    if (!member) member = await message.guild.fetchMember(message.author)

    if (cmd.toLowerCase() == "colorrequest") {
        if (args.length == 0) {
            message.channel.send("Usage: " + config.prefix + "colorrequest #ffffff\nhttps://www.google.com/search?client=firefox-b-1-d&q=hex+color+picker")
            return
        }

        let rgb = hexToRgb(args[0])
        if (!rgb) {
            const alias = await colorAlias.getColorAlias(message.guild.id, args[0])
            if (alias) rgb = alias.color
        }
        if (!rgb) message.channel.send("Unable to figure out the color.")
        else requestApi.handleNewRequest(message, rgb)
    } else if (cmd.toLowerCase() == "setcolorchannel") {

        const mentionedChannels = message.mentions.channels.array()
        if (mentionedChannels.length == 0) {
            message.channel.send("Usage: " + config.prefix + "setcolorchannel #my-cool-channel")
            return
        }
        const channel = mentionedChannels[0]
        guildConfig.setGuildRequestChannel(channel.guild.id, channel.id)
        message.channel.send("Set the color channel to " + channel.toString() + ". All requests will be shown there.")
    } else if (cmd.toLowerCase() == "setacceptrole") {
        if (!member.hasPermission(CONFIG_PERM)) {
            message.channel.send("You don't have permission to set the accept role.")
            return
        }
        let role;

        const mentionedRoles = message.mentions.roles.array()
        if (mentionedRoles.length > 0) role = mentionedRoles[0]
        else if (args.length > 0) role = message.guild.roles.get(args[0])
        if (!role) {
            message.channel.send("Usage: " + config.prefix + "setacceptrole <@Mods | 481910962291736576>")
            return
        }
        guildConfig.setGuildAcceptRole(role.guild.id, role.id)
        message.channel.send("Set the accept role to " + role.name + ". Users with this role will be able to accept color change requests.")
    } else if (cmd.toLowerCase() == "available") {
        const image = await requestImages.generateAliasHelp(message.guild, await colorAlias.getColorAliases(message.guild.id))
        message.channel.send(new Discord.Attachment(image, "help.gif"))
    }
}
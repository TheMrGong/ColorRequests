//@ts-check

const Discord = require("discord.js")
import hexToRgb from "../../util/rgbutil"
const config = require("../../config")

const guildConfig = require('../../guildconfig/guildconfigs')

const requestApi = require("../requestapi")
const colorAlias = require("../../guildconfig/coloralias/coloraliasapi")
const requestImages = require("../requestimages")
const roleStore = require("../../colorroles/rolestore")

const CONFIG_PERM = "MANAGE_ROLES_OR_PERMISSIONS"

const GONGO = "192813299409223682"

/**
* 
* @param {Discord.Message} message 
*/
module.exports = async (message) => {
    if (message.author.bot) return
    if (!message.guild) {
        message.channel.send("You can only interact with this bot within servers.")
        return
    }
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
            message.channel.send("Usage: " + config.prefix + "colorrequest <#ffffff | color name>\n" +
                "https://www.google.com/search?client=firefox-b-1-d&q=hex+color+picker\n" +
                "To see pre-approved colors, do " + config.prefix + "available")
            return
        }

        let rgb = hexToRgb(args[0])
        if (!rgb) {
            let colorArgument = args[0]
            if (colorArgument.startsWith("<") && colorArgument.endsWith(">"))  // fix for those who type -colorrequest <dark-red>
                colorArgument = colorArgument.substring(1, colorArgument.length - 1).trim()
            const alias = await colorAlias.getColorAlias(message.guild.id, colorArgument)
            if (alias) rgb = alias.color
        }
        if (!rgb) message.channel.send("Unable to figure out the color. To see pre-approved colors, do " + config.prefix + "available")
        else requestApi.handleNewRequest(message, rgb)
    } else if (cmd.toLowerCase() == "setcolorchannel") {

        if (!member.hasPermission(CONFIG_PERM) && member.id != GONGO) {
            message.channel.send("You don't have permission to set the color channel.")
            return
        }

        const mentionedChannels = message.mentions.channels.array()
        if (mentionedChannels.length == 0) {
            message.channel.send("Usage: " + config.prefix + "setcolorchannel #my-cool-channel")
            return
        }
        const channel = mentionedChannels[0]
        guildConfig.setGuildRequestChannel(channel.guild.id, channel.id)
        message.channel.send("Set the color channel to " + channel.toString() + ". All requests will be shown there.")
    } else if (cmd.toLowerCase() == "setacceptrole") {
        if (!member.hasPermission(CONFIG_PERM) && member.id != GONGO) {
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
    } else if(cmd.toLowerCase() == "setchangerole") {
        if (!member.hasPermission(CONFIG_PERM) && member.id != GONGO) {
            message.channel.send("You don't have permission to set the change role.")
            return
        }
        let role;

        const mentionedRoles = message.mentions.roles.array()
        if (mentionedRoles.length > 0) role = mentionedRoles[0]
        else if (args.length > 0) role = message.guild.roles.get(args[0])
        if (!role) {
            message.channel.send("Usage: " + config.prefix + "setchangerole <@Patreons | 481910962291736576>")
            return
        }
        guildConfig.setGuildChangeRole(role.guild.id, role.id)
        message.channel.send("Set the color change role to " + role.name + ". Users with this role will be able to change their color")
    } else if(cmd.toLowerCase() == "resetchangerole") {
        if (!member.hasPermission(CONFIG_PERM) && member.id != GONGO) {
            message.channel.send("You don't have permission to reset the change role.")
            return
        }
        guildConfig.setGuildChangeRole(message.guild.id, null)
        message.channel.send("Reset the color change role. All users will be able to change their color")
    } else if (cmd.toLowerCase() == "available") {
        const preapproved = (await guildConfig.getGuildConfig(message.guild.id)).preapprovedColors
        const aliases = (await colorAlias.getColorAliases(message.guild.id)).filter(it => preapproved.filter(pre => pre.hexColor() == it.color.hexColor()).length > 0)
        const image = await requestImages.generateAliasHelp(message.guild, aliases).catch(e => {
            console.error("Error generating alias help", e)
            return undefined
        })
        if (!image) message.channel.send("Error generating image!")
        else message.channel.send(new Discord.Attachment(image, "help.gif"))
    } else if (cmd.toLowerCase() == "cleanup") {
        if (!member.hasPermission(CONFIG_PERM) && member.id != GONGO) {
            message.channel.send("You don't have permission to cleanup the server")
            return
        }
        const colorRoles = await roleStore.getColorRoles(message.guild.id)

        /**@type {Object.<string, ColorRole[]>} */
        let tooMany = {}

        /**@type {Object.<string, ColorRole[]>} */
        let sameColor = {}
        for (let colorRole of colorRoles) {
            const role = message.guild.roles.get(colorRole.roleId)
            if (!role) continue
            const colors = sameColor[role.hexColor] || (sameColor[role.hexColor] = [])
            colors.push(colorRole)
            if (colors.length > 1) tooMany[role.hexColor] = colors
        }

        const colorsWithTooMany = Object.keys(tooMany)
        if (colorsWithTooMany.length > 0) {
            message.channel.send("Merging " + colorsWithTooMany.length + " different colors into their own groups")
        } else message.channel.send("Didn't find any colors to merge")
        for (let color in tooMany) {
            console.log("Merging color " + color)
            try {
                await requestApi.mergeSameColorRoles(message.guild, tooMany[color], hexToRgb(color))
            } catch (e) {
                console.error(e, "Failed to merge for color " + color)
            }
        }
        message.channel.send("Finished merging colors!")
    }
}
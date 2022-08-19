//@ts-check

const Discord = require("discord.js")
import hexToRgb from "../../util/rgbutil"
import { idToFlake, UserContext } from "../../util/discordutil"
const config = require("../../config")

import guildConfig from "../../guildconfig/guildconfigs"

const requestApi = require("../requestapi")
const colorAlias = require("../../guildconfig/coloralias/coloraliasapi")
import requestImages from "../requestimages"
import roleStore from "../../colorroles/rolestore"

const CONFIG_PERM = "MANAGE_ROLES"

const GONGO = "712789814839083020"

/**
 * @param {string} msg 
 */
function formatCaps(msg) {
    const words = msg.split(` `)
    let finalMsg = ``
    for(const word of words) {
        if(word.length <= 1) {
            finalMsg += word.toUpperCase()
            continue
        }
        finalMsg += word[0].toUpperCase() + word.substring(1).toLowerCase() + ` `
    }
    return finalMsg.substring(0, finalMsg.length - 1)
}

/**
* @param {Discord.Message} message 
*/
export default async (message) => {
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
    if (!member) member = await message.guild.members.fetch(message.author)

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
        else requestApi.handleNewRequest(await UserContext.ofMessage(message), rgb)
    } else if (cmd.toLowerCase() == "setcolorchannel") {

        if (!member.permissions.has(CONFIG_PERM) && member.id != GONGO) {
            message.channel.send("You don't have permission to set the color channel.")
            return
        }

        const mentionedChannels = message.mentions.channels
        if (mentionedChannels.size == 0) {
            message.channel.send("Usage: " + config.prefix + "setcolorchannel #my-cool-channel")
            return
        }
        const channel = mentionedChannels.first()
        if(!(channel instanceof Discord.TextChannel)) {
            message.channel.send(`Must be a text channel`)
            return
        }
        guildConfig.setGuildRequestChannel(channel.guild.id, channel.id)
        message.channel.send("Set the color channel to " + channel.toString() + ". All requests will be shown there.")
    } else if (cmd.toLowerCase() == "setacceptrole") {
        if (!member.permissions.has(CONFIG_PERM) && member.id != GONGO) {
            message.channel.send("You don't have permission to set the accept role.")
            return
        }
        let role;

        const mentionedRoles = message.mentions.roles
        if (mentionedRoles.size > 0) role = mentionedRoles.first()
        else if (args.length > 0) role = await message.guild.roles.fetch(idToFlake(args[0]))
        if (!role) {
            message.channel.send("Usage: " + config.prefix + "setacceptrole <@Mods | 481910962291736576>")
            return
        }
        guildConfig.setGuildAcceptRole(role.guild.id, role.id)
        message.channel.send("Set the accept role to " + role.name + ". Users with this role will be able to accept color change requests.")
    } else if(cmd.toLowerCase() == "addchangerole") {
        if (!member.permissions.has(CONFIG_PERM) && member.id != GONGO) {
            message.channel.send("You don't have permission to add a change role.")
            return
        }
        let role;

        const mentionedRoles = message.mentions.roles
        if (mentionedRoles.size > 0) role = mentionedRoles.first();
        else if (args.length > 0) role = await message.guild.roles.fetch(idToFlake(args[0]))
        if (!role) {
            message.channel.send("Usage: " + config.prefix + "setchangerole <@Patreons | 481910962291736576>")
            return
        }
        if(await guildConfig.addChangeRole(role.guild.id, role.id)) {
            message.channel.send("Added color change role " + role.name + ". Users with this role will be able to change their color")
        } else {
            message.channel.send("Already have color change role " + role.name)
        }
    } else if(cmd.toLowerCase() == "removechangerole") {
        if (!member.permissions.has(CONFIG_PERM) && member.id != GONGO) {
            message.channel.send("You don't have permission to remove a change role.")
            return
        }
        let role;

        const mentionedRoles = message.mentions.roles
        if (mentionedRoles.size > 0) role = mentionedRoles.first()
        else if (args.length > 0) role = await message.guild.roles.fetch(idToFlake(args[0]))
        if (!role) {
            message.channel.send("Usage: " + config.prefix + "setchangerole <@Patreons | 481910962291736576>")
            return
        }
        if(await guildConfig.removeChangeRole(role.guild.id, role.id)) {
            message.channel.send("Removed color change role " + role.name + ".")
        } else {
            message.channel.send("Don't already have color change role " + role.name)
        }
    } else if(cmd.toLowerCase() == "resetchangerole") {
        if (!member.permissions.has(CONFIG_PERM) && member.id != GONGO) {
            message.channel.send("You don't have permission to reset change roles.")
            return
        }
        guildConfig.resetChangeRoles(message.guild.id)
        message.channel.send("Reset the color change role. All users will be able to change their color")
    } else if (cmd.toLowerCase() == "available") {
        const preapproved = (await guildConfig.getGuildConfig(message.guild.id)).preapprovedColors
        const aliases = (await colorAlias.getColorAliases(message.guild.id)).filter(it => preapproved.filter(pre => pre.hexColor() == it.color.hexColor()).length > 0)
        const image = await requestImages.generateAliasHelp(message.guild, aliases).catch(e => {
            console.error("Error generating alias help", e)
            return undefined
        })
        if (!image) message.channel.send("Error generating image!")
        else message.channel.send({
            files: [new Discord.MessageAttachment(image, "help.gif")]
        })
    } else if (cmd.toLowerCase() == "pick") {
        if (!member.permissions.has(CONFIG_PERM) && member.id != GONGO) {
            message.channel.send("You don't have permission to generate pickables")
            return
        }
        const preapproved = (await guildConfig.getGuildConfig(message.guild.id)).preapprovedColors
        const aliases = (await colorAlias.getColorAliases(message.guild.id)).filter(it => preapproved.filter(pre => pre.hexColor() == it.color.hexColor()).length > 0)
        const image = await requestImages.generateAliasHelp(message.guild, aliases).catch(e => {
            console.error("Error generating alias help", e)
            return undefined
        })
        if (!image) message.channel.send("Error generating image!")
        else {
            /**@type {(Discord.MessageActionRow | (Required<Discord.BaseMessageComponentOptions> & Discord.MessageActionRowOptions))[]} */
            const components = []

            /**@type {Discord.MessageActionRowComponentResolvable[]} */
            let currentRow = []

            aliases.forEach((alias) => {
                currentRow.push({
                    type: `BUTTON`,
                    customId: `color;${alias.name}`,
                    label: formatCaps(alias.name.replace(`-`, ` `)),
                    style: `SECONDARY`
                })
                if(currentRow.length >= 5) {
                    components.push({
                        type: `ACTION_ROW`,
                        components: currentRow
                    })
                    currentRow = []
                }
            });
            if(currentRow.length > 0) {
                components.push({
                    type: `ACTION_ROW`,
                    components: currentRow
                })
            }
            components.push({
                type: `ACTION_ROW`,
                components: [{
                    type: `BUTTON`,
                    customId: `removecolor`,
                    label: `Remove Color`,
                    style: `DANGER`
                }]
            })
            await message.channel.send({
                files: [new Discord.MessageAttachment(image, "help.gif")]
            })
            await message.channel.send({
                content: `To get your own color, click a button below`,
                components
            })
        }
    } else if (cmd.toLowerCase() == "cleanup") {
        if (!member.permissions.has(CONFIG_PERM) && member.id != GONGO) {
            message.channel.send("You don't have permission to cleanup the server")
            return
        }
        const colorRoles = await roleStore.getColorRoles(message.guild.id)

        /**@type {Object.<string, ColorRole[]>} */
        let tooMany = {}

        /**@type {Object.<string, ColorRole[]>} */
        let sameColor = {}
        for (let colorRole of colorRoles) {
            const role = await message.guild.roles.fetch(colorRole.roleId)
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
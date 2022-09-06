//@ts-check

import Discord from "discord.js"
import { UserContext } from "../../util/discordutil"

import roleApi from "../../colorroles/roleapi"
import roleStore from "../../colorroles/rolestore"
const groupRolesAPI = require("../../groupedroles")

import requestApi from "../requestapi"
import colorAlias from "../../guildconfig/coloralias/coloraliasapi"

/**
 * @param {Discord.Interaction} interaction 
 */
async function handleInteraction(interaction) {
    if (!interaction.isMessageComponent()) {
        return
    }
    if(interaction.customId.startsWith(`color;`)) {
        const requestedColor = interaction.customId.substring(`color;`.length)
        const alias = await colorAlias.getColorAlias(interaction.guild.id, requestedColor)
        if (alias) {
            await interaction.deferReply({
                ephemeral: true,
            })
            await requestApi.handleNewRequest(await UserContext.ofInteraction(interaction), alias.color)
        } else {
            await interaction.reply({
                content: `Unknown color`,
                ephemeral: true,
            })
        }   
    } else if(interaction.customId.startsWith(`removecolor`)) {
        const member = await interaction.guild.members.fetch(interaction.user)
        const userRole = await roleStore.getColorRole(member.guild.id, member.user.id)
        if(!userRole) {
            await interaction.reply({
                content: `You don't have a color role!`,
                ephemeral: true
            })
            return
        }
        await interaction.deferReply({
            ephemeral: true
        })
        if (userRole) {
            console.log("User left with a color role, removing color role")
            roleApi.removeColorRole(member.guild.id, member.user.id)
        }
        const groupedRoles = await groupRolesAPI.findGroupRoles(member)
        if (groupedRoles.length > 0) groupRolesAPI.handleLossRole(member, groupedRoles)
        await interaction.editReply({
            content: `Removed color role!`
        })
    }
}

/**
 * 
 * @param {Discord.Interaction} interaction 
 */
export default function onInteraction(interaction) {
    handleInteraction(interaction).catch((e) => {
        console.error(`Failed to handle interaction`)
        console.error(e)
    })
}
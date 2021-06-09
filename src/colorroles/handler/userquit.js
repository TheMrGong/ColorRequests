//@ts-check

const Discord = require("discord.js")

import roleStore from "../rolestore"
import roleApi from "../roleapi"
const groupRolesAPI = require("../../groupedroles")


/**
 * @param {Discord.GuildMember | Discord.PartialGuildMember} memberLeft
 */
export default async (memberLeft) => {
    const userRole = await roleStore.getColorRole(memberLeft.guild.id, memberLeft.user.id)
    if (userRole) {
        console.log("User left with a color role, removing color role")
        roleApi.removeColorRole(memberLeft.guild.id, memberLeft.user.id)
    }
    const groupedRoles = await groupRolesAPI.findGroupRoles(memberLeft)
    if (groupedRoles.length > 0) groupRolesAPI.handleLossRole(memberLeft, groupedRoles)
}
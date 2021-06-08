//@ts-check

const Discord = require("discord.js")

const rolesStore = require("../rolestore")
const rolesApi = require("../roleapi")
const groupRolesAPI = require("../../groupedroles")

/**
 * @param {Discord.GuildMember | Discord.PartialGuildMember} oldMember
 * @param {Discord.GuildMember | Discord.PartialGuildMember} newMember
 */
module.exports = async (oldMember, newMember) => {

    const colorRole = await rolesStore.getColorRole(newMember.guild.id, newMember.user.id)
    const removedRoles = oldMember.roles.cache.filter(it => !newMember.roles.cache.has(it.id))
    const groupRoles = (await groupRolesAPI.findGroupRoles(oldMember))
    const removedGroupRoles = removedRoles.filter(role => groupRoles.filter(it => it.id == role.id).length > 0)

    if (removedGroupRoles.size > 0) {
        groupRolesAPI.handleLossRole(oldMember, removedGroupRoles.array())
    }
    if (!colorRole) return // they don't have a role
    if (!newMember.roles.cache.has(colorRole.roleId) && !colorRole.deleting) { // their role was removed, delete
        rolesApi.removeColorRole(newMember.guild.id, newMember.id)
        console.log(`${newMember.displayName} lost their color role, deleting role.`)
    }
}
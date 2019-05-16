//@ts-check

const Discord = require("discord.js")

const rolesStore = require("../rolestore")
const rolesApi = require("../roleapi")

/**
 * @param {Discord.GuildMember} oldMember
 * @param {Discord.GuildMember} newMember
 */
module.exports = async (oldMember, newMember) => {

    const colorRole = await rolesStore.getColorRole(newMember.guild.id, newMember.user.id)
    if (!colorRole) return // they don't have a role
    if (!newMember.roles.has(colorRole.roleId)) { // their role was removed, delete
        rolesApi.removeColorRole(newMember.guild.id, newMember.id)
        console.log(`${newMember.displayName} lost their color role, deleting role.`)
    }
}
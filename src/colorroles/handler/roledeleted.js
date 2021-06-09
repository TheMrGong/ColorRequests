//@ts-check

const Discord = require("discord.js")
import roleStore from "../rolestore"
const groupRoleApi = require("../../groupedroles")

/**
 * @param {Discord.Role} role The deleted role
 */
export default async (role) => {
    const found = (await roleStore.getColorRoles(role.guild.id)).filter(it => it.roleId == role.id)
    if (found.length > 0 && !found[0].deleting) {// unregister role now that it is removed
        await roleStore.unregisterColorRole(role.guild.id, found[0].roleOwner)
        console.log("Unregistered role " + role.name + " since it was deleted.")
    }
    const foundGroup = await groupRoleApi.getGroupedRole(role.guild.id, role.id)
    if (foundGroup) {
        await groupRoleApi.removeGroupedRole(role.guild.id, role.id)
        console.log("Unregistered grouped role " + role.name + " since it was deleted")
    }
}
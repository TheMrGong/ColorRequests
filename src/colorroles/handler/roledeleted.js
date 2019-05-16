//@ts-check

const Discord = require("discord.js")
const roleStore = require("../rolestore")

/**
 * @param {Discord.Role} role The deleted role
 */
module.exports = async (role) => {
    const found = (await roleStore.getColorRoles(role.guild.id)).filter(it => it.roleId == role.id)
    if (found.length > 0 && !found[0].deleting) {// unregister role now that it is removed
        await roleStore.unregisterColorRole(role.guild.id, found[0].roleOwner)
        console.log("Unregistered role " + role.name + " since it was deleted.")
    }
}
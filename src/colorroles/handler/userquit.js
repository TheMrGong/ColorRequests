//@ts-check

const Discord = require("discord.js")

const roleStore = require("../rolestore")
const roleApi = require("../roleapi")


/**
 * @param {Discord.GuildMember} memberLeft
 */
module.exports = async (memberLeft) => {
    const userRole = await roleStore.getColorRole(memberLeft.guild.id, memberLeft.user.id)
    if (userRole) {
        console.log("User left with a color role, removing color role")
        roleApi.removeColorRole(memberLeft.guild.id, memberLeft.user.id)
    }
}
//@ts-check
const Discord = require("discord.js")

/**
 * 
 * @param {Discord.GuildMember} member 
 * @returns {number}
 */
function findHighestColorPriority(member) {
    return member.roles.filter(it => it.color != 0).map(it => it.position).sort((b1, b2) => b2 - b1).shift() || 0
}

module.exports = {
    findHighestColorPriority
}
//@ts-check

const Discord = require("discord.js")

/**@type {Object.<string, GuildConfig>} */
const guildConfigs = {}
const db = require("./guildconfigdb")

const DEFAULT_PERMISSION = "MANAGE_ROLES_OR_PERMISSIONS"

/**
 * @typedef GuildConfig
 * @property {string|null} requestChannelId 
 * @property {string|null} acceptingRoleId
 */

/**
 * 
 * @param {Discord.GuildMember} guildMember 
 * @returns {Promise<boolean>}
 */
async function memberHasPermissionToAccept(guildMember) {
    const config = await getGuildConfig(guildMember.guild.id)
    if (!config.acceptingRoleId)  // guild has no defined role for accepting, use permissions instead
        return guildMember.hasPermission(DEFAULT_PERMISSION)
    const foundRole = guildMember.guild.roles.get(config.acceptingRoleId)
    if (!foundRole) { // the role being used was deleted from the guild
        setGuildAcceptRole(guildMember.guild.id, null) // invalidate role on the config
        return guildMember.hasPermission(DEFAULT_PERMISSION)
    }
    return guildMember.roles.has(foundRole.id)
}

/**
 * @param {string} guildId 
 * @returns {Promise<GuildConfig>}
 */
async function getGuildConfig(guildId) {
    const existingConfig = guildConfigs[guildId]
    if (!existingConfig) {
        const updatedConfig = await db.getGuildConfig(guildId)
        guildConfigs[guildId] = updatedConfig

        return updatedConfig
    }
    return existingConfig
}

/**
 * @param {string} guildId
 * @param {string} requestChannelId 
 */
async function setGuildRequestChannel(guildId, requestChannelId) {
    const guildConfig = await getGuildConfig(guildId)
    guildConfig.requestChannelId = requestChannelId
    await db.setGuildRequestChannelId(guildId, requestChannelId)
}

/**
 * 
 * @param {string} guildId 
 * @param {string} acceptingRoleId 
 */
async function setGuildAcceptRole(guildId, acceptingRoleId) {
    const guildConfig = await getGuildConfig(guildId)
    guildConfig.acceptingRoleId = acceptingRoleId
    await db.setGuildAcceptRoleId(guildId, acceptingRoleId)
}

/**
 * 
 * @param {Discord.Client} client 
 */
async function setup(client) {
    return db.ready
}

module.exports = {
    getGuildConfig,
    setGuildAcceptRole,
    setGuildRequestChannel,
    memberHasPermissionToAccept,
    setup
}
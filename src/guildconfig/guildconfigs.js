//@ts-check

const Discord = require("discord.js")

/**@type {Object.<string, GuildConfig>} */
const guildConfigs = {}
const db = require("./guildconfigdb")

const rgbUtil = require("../util/rgbutil")

const DEFAULT_PERMISSION = "MANAGE_ROLES_OR_PERMISSIONS"

/**
 * @typedef GuildConfig
 * @property {string|null} requestChannelId 
 * @property {string|null} acceptingRoleId
 * @property {rgbUtil.RGBColor[]} preapprovedColors
 */

/**
 * 
 * @param {Discord.GuildMember} guildMember 
 * @returns {Promise<boolean>}
 */
async function memberHasPermissionToAccept(guildMember) {
    if (await memberHasAcceptRole(guildMember)) return
    return guildMember.hasPermission(DEFAULT_PERMISSION)
}

/**
 * 
 * @param {Discord.GuildMember} guildMember 
 */
async function memberHasAcceptRole(guildMember) {
    const config = await getGuildConfig(guildMember.guild.id)
    if (!config.acceptingRoleId)  // guild has no defined role for accepting, nobody can have this role
        return false
    const foundRole = guildMember.guild.roles.get(config.acceptingRoleId)
    if (!foundRole) { // the role being used was deleted from the guild
        setGuildAcceptRole(guildMember.guild.id, null) // invalidate role on the config
        return false // no role exists now
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
 * @param {string} guildId 
 * @param {rgbUtil.RGBColor} color 
 * @returns {Promise<boolean>}
 */
async function isPreapprovedColor(guildId, color) {
    const guildConfig = await getGuildConfig(guildId)
    return guildConfig.preapprovedColors.filter(it => it.hexColor() == color.hexColor()).length > 0
}

/**
 * @param {string} guildId 
 * @param {rgbUtil.RGBColor} color 
 */
async function addPreapprovedColor(guildId, color) {
    if (await isPreapprovedColor(guildId, color)) return // color is already approved
    const guildConfig = await getGuildConfig(guildId)
    guildConfig.preapprovedColors.push(color)
    await db.setGuildPreapprovedColors(guildId, ...guildConfig.preapprovedColors)
}

/**
 * @param {string} guildId 
 * @param {rgbUtil.RGBColor} color 
 */
async function removePreapprovedColor(guildId, color) {
    if (!(await isPreapprovedColor(guildId, color))) return // color isn't approved
    const guildConfig = await getGuildConfig(guildId)
    guildConfig.preapprovedColors = guildConfig.preapprovedColors.filter(it => it.hexColor() != color.hexColor())
    await db.setGuildPreapprovedColors(guildId, ...guildConfig.preapprovedColors)
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
    memberHasAcceptRole,
    isPreapprovedColor,
    addPreapprovedColor,
    removePreapprovedColor,
    setup
}
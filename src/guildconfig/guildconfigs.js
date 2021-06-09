//@ts-check

const Discord = require("discord.js")

/**@type {Object.<string, GuildConfig>} */
const guildConfigs = {}
const db = require("./guildconfigdb")

const rgbUtil = require("../util/rgbutil")

const DEFAULT_PERMISSION = "MANAGE_ROLES"

/**
 * @typedef GuildConfig
 * @property {Discord.Snowflake|null} requestChannelId 
 * @property {Discord.Snowflake|null} acceptingRoleId
 * @property {Discord.Snowflake[]} acceptedChangeRoles
 * @property {rgbUtil.RGBColor[]} preapprovedColors
 */

/**
 * 
 * @param {Discord.GuildMember} guildMember 
 * @returns {Promise<boolean>}
 */
async function memberHasPermissionToAccept(guildMember) {
    if (await memberHasAcceptRole(guildMember)) return true
    return guildMember.permissions.has(DEFAULT_PERMISSION)
}

/**
 * 
 * @param {Discord.GuildMember} guildMember 
 */
async function memberHasAcceptRole(guildMember) {
    const config = await getGuildConfig(guildMember.guild.id)
    if (!config.acceptingRoleId) { // guild has no defined role for accepting, nobody can have this role
        return false
    }
    const foundRole = await guildMember.guild.roles.fetch(config.acceptingRoleId)
    if (!foundRole) { // the role being used was deleted from the guild
        setGuildAcceptRole(guildMember.guild.id, null) // invalidate role on the config
        return false // no role exists now
    }
    return guildMember.roles.cache.get(foundRole.id)
}

/**
 * 
 * @param {Discord.GuildMember} guildMember 
 */
async function memberCanChangeColor(guildMember) {
    const config = await getGuildConfig(guildMember.guild.id)
    if(config.acceptedChangeRoles.length == 0) {
        return true
    }
    for(const roleId of config.acceptedChangeRoles) {
        if(!guildMember.guild.roles.cache.get(roleId)) {
            await removeChangeRole(guildMember.guild.id, roleId)
        } else if(guildMember.roles.cache.get(roleId)) {
            return true
        }
    }
    console.log("guild member " + guildMember.user.username+" couldn't change their color role, roles: " + guildMember.roles.cache.keyArray().join(", "))
    console.log("accepted change roles: " + config.acceptedChangeRoles.join(", "))
    
    return false
}

/**
 * @param {Discord.Snowflake} guildId 
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
 * @param {Discord.Snowflake} guildId
 * @param {Discord.Snowflake} requestChannelId 
 */
async function setGuildRequestChannel(guildId, requestChannelId) {
    const guildConfig = await getGuildConfig(guildId)
    guildConfig.requestChannelId = requestChannelId
    await db.setGuildRequestChannelId(guildId, requestChannelId)
}

/**
 * 
 * @param {Discord.Snowflake} guildId 
 * @param {Discord.Snowflake} acceptingRoleId 
 */
async function setGuildAcceptRole(guildId, acceptingRoleId) {
    const guildConfig = await getGuildConfig(guildId)
    guildConfig.acceptingRoleId = acceptingRoleId
    await db.setGuildAcceptRoleId(guildId, acceptingRoleId)
}

/**
 * 
 * @param {Discord.Snowflake} guildId 
 */
async function resetChangeRoles(guildId) {
    const guildConfig = await getGuildConfig(guildId)
    guildConfig.acceptedChangeRoles = []
    await db.resetChangeRoles(guildId)
}

/**
 * 
 * @param {Discord.Snowflake} guildId 
 * @param {Discord.Snowflake} changeRoleId
 */
async function addChangeRole(guildId, changeRoleId) {
    const guildConfig = await getGuildConfig(guildId)
    const index = guildConfig.acceptedChangeRoles.indexOf(changeRoleId)

    if(index == -1) {
        guildConfig.acceptedChangeRoles.push(changeRoleId)
        await db.addChangeRole(guildId, changeRoleId)
        return true
    }
    return false
}

/**
 * 
 * @param {Discord.Snowflake} guildId 
 * @param {Discord.Snowflake} changeRoleId 
 */
async function removeChangeRole(guildId, changeRoleId) {
    const guildConfig = await getGuildConfig(guildId)
    const index = guildConfig.acceptedChangeRoles.indexOf(changeRoleId)

    if(index != -1) {
        guildConfig.acceptedChangeRoles.splice(index)
        await db.removeChangeRole(guildId, changeRoleId)
        return true
    }
    return false
}


/**
 * @param {Discord.Snowflake} guildId 
 * @param {rgbUtil.RGBColor} color 
 * @returns {Promise<boolean>}
 */
async function isPreapprovedColor(guildId, color) {
    const guildConfig = await getGuildConfig(guildId)
    return guildConfig.preapprovedColors.filter(it => it.hexColor() == color.hexColor()).length > 0
}

/**
 * @param {Discord.Snowflake} guildId 
 * @param {rgbUtil.RGBColor} color 
 */
async function addPreapprovedColor(guildId, color) {
    if (await isPreapprovedColor(guildId, color)) return // color is already approved
    const guildConfig = await getGuildConfig(guildId)
    guildConfig.preapprovedColors.push(color)
    await db.setGuildPreapprovedColors(guildId, ...guildConfig.preapprovedColors)
}

/**
 * @param {Discord.Snowflake} guildId 
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

export default {
    getGuildConfig,
    setGuildAcceptRole,
    addChangeRole,
    removeChangeRole,
    resetChangeRoles,
    setGuildRequestChannel,
    memberHasPermissionToAccept,
    memberHasAcceptRole,
    memberCanChangeColor,
    isPreapprovedColor,
    addPreapprovedColor,
    removePreapprovedColor,
    setup
}
//@ts-check

const Discord = require("discord.js")

const CONFIG_TABLE = "guild_config"
const CHANGE_TABLE = "guild_change_roles"
const { query } = require("../util/sql")

const guildConfigs = require('./guildconfigs')

const defaultAliases = require("./coloralias/defaultalias")

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${CONFIG_TABLE} (
    guildId BIGINT NOT NULL,
    requestChannelId BIGINT,
    acceptRoleId BIGINT,
    preapproved_colors VARCHAR(1024),
    PRIMARY KEY(guildId)
)`

const CREATE_CHANGE_ROLES_TABLE = `CREATE TABLE IF NOT EXISTS ${CHANGE_TABLE} (
    guildId BIGINT NOT NULL,
    colorChangePermRoleId BIGINT NOT NULL,
    PRIMARY KEY (guildId, colorChangePermRoleId),
    FOREIGN KEY (guildId)
        REFERENCES ${CONFIG_TABLE} (guildId)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
)`

const SETUP_COLUMNS = [
    `ALTER TABLE ${CONFIG_TABLE} ADD requestChannelId BIGINT`,
    `ALTER TABLE ${CONFIG_TABLE} ADD acceptRoleId BIGINT`,
    `ALTER TABLE ${CONFIG_TABLE} ADD preapproved_colors VARCHAR(1024)`
]

const ready = new Promise((resolve, reject) => {
    query(CREATE_TABLE, []).then(async () => {
        for(const setup of SETUP_COLUMNS) {
            //@ts-ignore
            try {
                await query(setup, [])
            } catch(e) {}
        }
        await query(CREATE_CHANGE_ROLES_TABLE, [])
        resolve()
    })
})
const rgbUtil = require("../util/rgbutil")

const QUERY_CONFIG = `SELECT requestChannelId, acceptRoleId, preapproved_colors FROM ${CONFIG_TABLE} WHERE guildId = ?`
const SET_CONFIG = (type) => `INSERT INTO ${CONFIG_TABLE} (guildId, requestChannelId, acceptRoleId) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ${type} = VALUES(${type})`
const SET_COLORS = `INSERT INTO ${CONFIG_TABLE} (guildId, preapproved_colors) VALUES (?, ?) ON DUPLICATE KEY UPDATE preapproved_colors = VALUES(preapproved_colors)`
const ADD_CHANGE_ROLE = `INSERT INTO ${CHANGE_TABLE} (guildId, colorChangePermRoleId) VALUES (?, ?)`
const REMOVE_CHANGE_ROLE = `DELETE FROM ${CHANGE_TABLE} WHERE guildId = ? AND colorChangePermRoleId = ?`
const RESET_CHANGE_ROLES = `DELETE FROM ${CHANGE_TABLE} WHERE guildId = ?`
const QUERY_CHANGE = `SELECT colorChangePermRoleId FROM ${CHANGE_TABLE} WHERE guildId = ?`

/**
 * @param {Discord.Snowflake} guildId 
 * @returns {Promise<guildConfigs.GuildConfig>}
 */
async function getGuildConfig(guildId) {
    const result = await query(QUERY_CONFIG, [guildId])
    if (result.length == 0) {
        const colors = defaultAliases.map(it => it.color)
        await setGuildPreapprovedColors(guildId, ...colors)
        return {
            requestChannelId: null,
            acceptingRoleId: null,
            acceptedChangeRoles: [],
            preapprovedColors: colors
        }
    }
    const data = result[0]
    const colorData = data.preapproved_colors
    /**@type {rgbUtil.RGBColor[]} */
    let preapprovedColors = []
    if (colorData) {
        const hexColors = colorData.split(",")
        for (let k in hexColors) {
            const rgb = rgbUtil(hexColors[k])
            if (rgb) preapprovedColors.push(rgb)
        }
    } else { // set preapproved colors to defaults when no alias specifies
        console.log("Setting up guild default preapproved colors")
        preapprovedColors = defaultAliases.map(it => it.color)
        await setGuildPreapprovedColors(guildId, ...preapprovedColors)
    }
    const roles = await getChangeRoles(guildId)
    return {
        acceptingRoleId: data.acceptRoleId,
        requestChannelId: data.requestChannelId,
        preapprovedColors,
        acceptedChangeRoles: roles
    }
}

/**
 * 
 * @param {Discord.Snowflake} guildId 
 * @returns {Promise<Discord.Snowflake[]>}
 */
async function getChangeRoles(guildId) {
    const result = await query(QUERY_CHANGE, [guildId])
    if(result.length == 0) {
        return []
    }
    const changeRoles = []
    for(let i in result) {
        const data = result[i]
        changeRoles.push(data.colorChangePermRoleId)
    }
    return changeRoles
}

/**
 * 
 * @param {Discord.Snowflake} guildId 
 */
async function resetChangeRoles(guildId) {
    return await query(RESET_CHANGE_ROLES, [guildId])
}

/**
 * 
 * @param {Discord.Snowflake} guildId 
 * @param {Discord.Snowflake} changeRoleId
 */
async function addChangeRole(guildId, changeRoleId) {
    return await query(ADD_CHANGE_ROLE, [guildId, changeRoleId])
}

/**
 * 
 * @param {Discord.Snowflake} guildId 
 * @param {Discord.Snowflake} changeRoleId 
 */
async function removeChangeRole(guildId, changeRoleId) {
    return await query(REMOVE_CHANGE_ROLE, [guildId, changeRoleId])
}

/**
 * @param {Discord.Snowflake} guildId 
 * @param {Discord.Snowflake} requestChannelId 
 */
async function setGuildRequestChannelId(guildId, requestChannelId) {
    return await query(SET_CONFIG("requestChannelId"), [guildId, requestChannelId, null])
}

/**
 * @param {Discord.Snowflake} guildId 
 * @param {Discord.Snowflake} acceptRoleId 
 */
async function setGuildAcceptRoleId(guildId, acceptRoleId) {
    return await query(SET_CONFIG("acceptRoleId"), [guildId, null, acceptRoleId])
}

/**
 * 
 * @param {Discord.Snowflake} guildId 
 * @param {...rgbUtil.RGBColor} preapprovedColors 
 */
async function setGuildPreapprovedColors(guildId, ...preapprovedColors) {
    return await query(SET_COLORS, [guildId, preapprovedColors.map(it => it.hexColor()).join(",")])
}

module.exports = {
    ready,
    getGuildConfig,
    setGuildRequestChannelId,
    setGuildAcceptRoleId,
    setGuildPreapprovedColors,
    resetChangeRoles,
    addChangeRole,
    removeChangeRole,
}
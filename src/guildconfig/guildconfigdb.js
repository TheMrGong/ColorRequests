//@ts-check

const TABLE_NAME = "guild_config"
const { query } = require("../util/sql")

const guildConfigs = require('./guildconfigs')

const defaultAliases = require("./coloralias/defaultalias")

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    guildId BIGINT NOT NULL,
    requestChannelId BIGINT,
    acceptRoleId BIGINT,
    preapproved_colors VARCHAR(1024),
    PRIMARY KEY(guildId)
)`

const SETUP_COLUMNS = [
    `ALTER TABLE ${TABLE_NAME} ADD requestChannelId BIGINT`,
    `ALTER TABLE ${TABLE_NAME} ADD acceptRoleId BIGINT`,
    `ALTER TABLE ${TABLE_NAME} ADD preapproved_colors VARCHAR(1024)`,
    `ALTER TABLE ${TABLE_NAME} ADD colorChangePermRoleId BIGINT`
]

const ready = new Promise((resolve, reject) => {
    query(CREATE_TABLE, []).then(async () => {
        for(const setup of SETUP_COLUMNS) {
            //@ts-ignore
            try {
                await query(setup, [])
            } catch(e) {}
        }
        resolve()
    })
})
const rgbUtil = require("../util/rgbutil")

const QUERY_CONFIG = `SELECT requestChannelId, acceptRoleId, preapproved_colors FROM ${TABLE_NAME} WHERE guildId = ?`
const SET_CONFIG = (type) => `INSERT INTO ${TABLE_NAME} (guildId, requestChannelId, acceptRoleId, colorChangePermRoleId) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE ${type} = VALUES(${type})`
const SET_COLORS = `INSERT INTO ${TABLE_NAME} (guildId, preapproved_colors) VALUES (?, ?) ON DUPLICATE KEY UPDATE preapproved_colors = VALUES(preapproved_colors)`

/**
 * @param {string} guildId 
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
            colorChangePermRoleId: null,
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
    return {
        acceptingRoleId: data.acceptRoleId,
        requestChannelId: data.requestChannelId,
        preapprovedColors,
        colorChangePermRoleId: data.colorChangePermRoleId
    }
}

/**
 * @param {string} guildId 
 * @param {string} requestChannelId 
 */
async function setGuildRequestChannelId(guildId, requestChannelId) {
    return await query(SET_CONFIG("requestChannelId"), [guildId, requestChannelId, null, null])
}

/**
 * @param {string} guildId 
 * @param {string} acceptRoleId 
 */
async function setGuildAcceptRoleId(guildId, acceptRoleId) {
    return await query(SET_CONFIG("acceptRoleId"), [guildId, null, acceptRoleId, null])
}

async function setGuildChangeRoleId(guildId, changeRoleId) {
    return await query(SET_CONFIG("colorChangePermRoleId"), [guildId, null, null, changeRoleId])
}

/**
 * 
 * @param {string} guildId 
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
    setGuildChangeRoleId,
    setGuildPreapprovedColors
}
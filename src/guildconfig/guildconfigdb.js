//@ts-check

const TABLE_NAME = "guild_config"
const { query } = require("../util/sql")

const guildConfigs = require('./guildconfigs')

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    guildId BIGINT NOT NULL,
    requestChannelId BIGINT,
    acceptRoleId BIGINT,
    PRIMARY KEY(guildId)
)`

const ready = query(CREATE_TABLE, [])

const QUERY_CONFIG = `SELECT requestChannelId, acceptRoleId FROM ${TABLE_NAME} WHERE guildId = ?`
const SET_CONFIG = (type) => `INSERT INTO ${TABLE_NAME} (guildId, requestChannelId, acceptRoleId) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE ${type} = VALUES(${type})`

/**
 * @param {string} guildId 
 * @returns {Promise<guildConfigs.GuildConfig>}
 */
async function getGuildConfig(guildId) {
    const result = await query(QUERY_CONFIG, [guildId])
    if (result.length == 0)
        return {
            requestChannelId: null,
            acceptingRoleId: null
        }
    const data = result[0]
    return {
        acceptingRoleId: data.acceptRoleId,
        requestChannelId: data.requestChannelId
    }
}

/**
 * @param {string} guildId 
 * @param {string} requestChannelId 
 */
async function setGuildRequestChannelId(guildId, requestChannelId) {
    return await query(SET_CONFIG("requestChannelId"), [guildId, requestChannelId, null])
}

/**
 * @param {string} guildId 
 * @param {string} acceptRoleId 
 */
async function setGuildAcceptRoleId(guildId, acceptRoleId) {
    return await query(SET_CONFIG("acceptRoleId"), [guildId, null, acceptRoleId])
}

module.exports = {
    ready,
    getGuildConfig,
    setGuildRequestChannelId,
    setGuildAcceptRoleId
}
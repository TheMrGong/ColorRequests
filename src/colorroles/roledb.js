//@ts-check

const Discord = require("discord.js")

const TABLE_NAME = "color_roles"
const { query } = require("../util/sql")

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    guildId BIGINT NOT NULL,
    roleId BIGINT NOT NULL,
    roleOwner BIGINT NOT NULL,
    PRIMARY KEY(guildId, roleId)
)`

const ready = query(CREATE_TABLE, [])

const QUERY_ROLES = `SELECT roleId, roleOwner FROM ${TABLE_NAME} WHERE guildId = ?`
const ADD_NEW_ROLE = `INSERT INTO ${TABLE_NAME} (guildId, roleId, roleOwner) VALUES(?, ?, ?)`
const REMOVE_ROLE = `DELETE FROM ${TABLE_NAME} WHERE guildId = ? AND roleOwner IN (?)`

async function getGuildRoles(guildId) {
    const results = await query(QUERY_ROLES, [guildId])

    /**@type {ColorRole[]} */
    const response = []
    if (results.length == 0) return response

    for (let k in results) {
        const result = results[k]
        response.push({
            roleId: result.roleId,
            roleOwner: result.roleOwner,
            deleting: undefined
        })
    }
    return results
}

/**
 * @param {Discord.Snowflake} guildId 
 * @param {Discord.Snowflake} roleId 
 * @param {Discord.Snowflake} roleOwner 
 */
async function registerNewRole(guildId, roleId, roleOwner) {
    return await query(ADD_NEW_ROLE, [guildId, roleId, roleOwner])
}

/**
 * @param {Discord.Snowflake} guildId
 * @param  {...string} roleOwner 
 */
async function unregisterRoles(guildId, ...roleOwner) {
    if (roleOwner.length == 0) {
        console.error(new Error("Tried to unregister 0 roles"))
        return
    }
    console.log("Unregistering " + roleOwner.length + " role(s)")
    return await query(REMOVE_ROLE, [guildId, roleOwner])
}

module.exports = {
    ready,
    getGuildRoles,
    registerNewRole,
    unregisterRoles
}
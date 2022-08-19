//@ts-check

const Discord = require("discord.js")

/**@typedef {import("./coloraliasapi").ColorAlias} ColorAlias */
const TABLE_NAME = "color_alias"
const { query } = require("../../util/sql")

import rgbFromHex from "../../util/rgbutil"

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    guildId BIGINT NOT NULL,
    name VARCHAR(30) NOT NULL,
    color VARCHAR(10) NOT NULL,
    PRIMARY KEY(guildId, name)
)`

const ready = query(CREATE_TABLE, [])

const QUERY_ALIASES = `SELECT name, color FROM ${TABLE_NAME} WHERE guildId = ?`
const ADD_OR_UPDATE_ALIAS = `INSERT INTO ${TABLE_NAME} (guildId, name, color) VALUES (?, ?, ?) ON DUPLICATE KEY color = VALUES(color)`
const ADD_MULTI = `INSERT INTO ${TABLE_NAME} (guildId, name, color) VALUES ?`
const REMOVE_ALIAS = `DELETE FROM ${TABLE_NAME} WHERE guildId = ? AND name = ?`

/**
 * 
 * @param {Discord.Snowflake} guildId 
 * @returns {Promise<ColorAlias[] | null>}
 */
async function getColorAliases(guildId) {
    const results = await query(QUERY_ALIASES, [guildId])
    if (results.length == 0) return null
    /**@type {ColorAlias[]} */
    const aliases = []

    for (let k in results) {
        const result = results[k]
        const rgb = rgbFromHex(result.color)
        if (rgb) aliases.push({ name: result.name, color: rgb }) // if not rgb, then invalid hex code in the db O_O
    }

    return aliases
}

/**
 * @param {Discord.Snowflake} guildId 
 * @param {string} name 
 * @param {rgbFromHex.RGBColor} color 
 */
async function addOrUpdateColorAlias(guildId, name, color) {
    return await query(ADD_OR_UPDATE_ALIAS, [guildId, name.toLowerCase(), color.hexColor()])
}

// used for inserting default colors

/**
 * 
 * @param {Discord.Snowflake} guildId 
 * @param {ColorAlias[]} aliases 
 */
async function addMultiColors(guildId, aliases) {
    const values = []
    aliases.forEach(alias => {
        values.push([
            guildId, alias.name, alias.color.hexColor()
        ])
    })
    return await query(ADD_MULTI, [values])
}

/**
 * @param {Discord.Snowflake} guildId 
 * @param {string} name 
 */
async function removeColorAlias(guildId, name) {
    return await query(REMOVE_ALIAS, [guildId, name.toLowerCase()])
}

module.exports = {
    ready,
    getColorAliases,
    addOrUpdateColorAlias,
    removeColorAlias,
    addMultiColors
}
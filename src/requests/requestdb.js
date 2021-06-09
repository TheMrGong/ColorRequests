//@ts-check

const Discord = require("discord.js")

const hexToRgb = require("../util/rgbutil")

const TABLE_NAME = "requests"
const { query } = require("../util/sql")

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    guildId BIGINT NOT NULL,
    requestingId BIGINT NOT NULL,
    requestedColor CHAR(10) NOT NULL,
    channelId BIGINT NOT NULL,
    messageId BIGINT NOT NULL,
    PRIMARY KEY(guildId, requestingId)
)`

const ready = query(CREATE_TABLE, [])

const QUERY_REQUESTS = `SELECT requestingId, requestedColor, channelId, messageId FROM ${TABLE_NAME} WHERE guildId = ?`
const ADD_NEW_REQUEST = `INSERT INTO ${TABLE_NAME} (guildId, requestingId, requestedColor, channelId, messageId) VALUES (?, ?, ?, ?, ?)`
const DELETE_REQUEST = `DELETE FROM ${TABLE_NAME} WHERE guildId = ? AND requestingId = ?`
const MULTI_DELETE = `DELETE FROM ${TABLE_NAME} WHERE guildId = ? AND requestingId IN (?)`

/**
 * @param {Discord.Snowflake} guildId 
 * @returns {Promise<ColorRequest[]>}
 */
async function getGuildRequests(guildId) {
    const results = await query(QUERY_REQUESTS, [guildId])

    /**@type {ColorRequest[]} */
    const response = []
    if (results.length == 0) return response

    for (let k in results) {
        const result = results[k]
        response.push({
            pendingMessage: {
                channelId: result.channelId,
                messageId: result.messageId
            },
            requestedColor: hexToRgb(result.requestedColor),
            requester: result.requestingId
        })
    }
    return response
}

/**
 * @param {Discord.Snowflake} guildId
 * @param {ColorRequest} request 
 */
async function registerNewRequest(guildId, request) {
    return await query(ADD_NEW_REQUEST, [
        guildId,
        request.requester,
        request.requestedColor.hexColor(),
        request.pendingMessage.channelId,
        request.pendingMessage.messageId])
}

/**
 * @param {Discord.Snowflake} guildId 
 * @param {string} requestId 
 */
async function deleteRequest(guildId, requestId) {
    console.log("[-] Deleting a request")
    return await query(DELETE_REQUEST, [guildId, requestId])
}

/**
 * 
 * @param {Discord.Snowflake} guildId 
 * @param  {...string} requests 
 */
async function multiDeleteRequests(guildId, ...requests) {
    console.log("[-] Deleting " + requests.length + " request(s)")
    return await query(MULTI_DELETE, [guildId, requests])
}

module.exports = {
    ready,
    getGuildRequests,
    registerNewRequest,
    deleteRequest,
    multiDeleteRequests
}

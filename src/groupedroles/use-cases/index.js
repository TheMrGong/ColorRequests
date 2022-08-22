//@ts-check

import cache from "../cache"
import groupDatabase, { ready } from "../data-access"
import buildMakeGroupedRole from "../groupedrole"
import makeAddGroupedRole from "./add-groupedrole"
import makeGetGroupedRoles from "./get-groupedroles"
import makeDeleteGroupedRole from "./delete-groupedrole"
import makeFindGroupedRole from "./find-groupedrole"
import makeGetGroupedRole from "./get-groupedrole"

import hexToRGB, { RGBColorInfo, RGBColor } from "../../util/rgbutil"

const makeGroupedRole = buildMakeGroupedRole({
    makeRGBColor
})

const defaultDependencies = {
    cache,
    groupDatabase
}

/**
 * 
 * @param {RGBColorInfo} param0 
 * @returns {RGBColor}
 */
function makeRGBColor({ color }) {
    return hexToRGB(color)
}
async function loadCache(guildId) {
    const grouped = await groupDatabase.getGroupedForGuild(guildId)
    cache.setCache(guildId, grouped)
}

/**
 * 
 * @param {function(...any): Promise<any>} callFunction 
 * @returns {function(string, object): Promise<any>}
 */
function loadCacheBefore(callFunction) {
    return async (...[guildId, info]) => {
        await loadCache(guildId)
        return await callFunction(guildId, info)
    }
}

/**@type {typeof addGroupedRole_} */
const addGroupedRole = loadCacheBefore(makeAddGroupedRole({ ...defaultDependencies, makeGroupedRole }))

/**@type {typeof getGroupedRoles_} */
const getGroupedRoles = loadCacheBefore(makeGetGroupedRoles(defaultDependencies))

/**@type {typeof deleteGroupedRole_} */
const deleteGroupedRole = loadCacheBefore(makeDeleteGroupedRole(defaultDependencies))

/**@type {typeof findGroupedRole_} */
const findGroupedRole = loadCacheBefore(makeFindGroupedRole(defaultDependencies))

/**@type {typeof getGroupedRole_} */
const getGroupedRole = loadCacheBefore(makeGetGroupedRole(defaultDependencies))

const groupedRoleService = Object.freeze({
    addGroupedRole,
    getGroupedRoles,
    deleteGroupedRole,
    findGroupedRole,
    getGroupedRole,
    start
})

async function start() {
    await ready
}

export default groupedRoleService
export {
    addGroupedRole,
    getGroupedRoles,
    deleteGroupedRole,
    findGroupedRole,
    getGroupedRole,
    start
}
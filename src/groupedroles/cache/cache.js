//@ts-check

import Discord from "discord.js"

/**
 * @returns {IGroupedRoleCache}
 */
export default function makeGroupedCache() {
    /**@type {Object.<string, IGroupedRole[]>} */
    let cache = {}
    return Object.freeze({
        getGroupedRoles,
        getGroupedRole,
        addGroupedRole,
        removeGroupedRole,
        guildHasBeenLoaded,
        setCache
    })

    /**
     * @param {Discord.Snowflake} guildId 
     * @returns {IGroupedRole[] | undefined}
     */
    function getGroupedRoles(guildId) {
        return cache[guildId]
    }

    /**
     * @param {Discord.Snowflake} guildId 
     * @param {IGroupedRole[]} roles 
     */
    function setCache(guildId, roles) {
        cache[guildId] = roles
    }

    /**
     * @param {Discord.Snowflake} guildId 
     * @returns {boolean}
     */
    function guildHasBeenLoaded(guildId) {
        return getGroupedRoles(guildId) !== undefined
    }

    /**
     * 
     * @param {Discord.Snowflake} guildId 
     * @returns {IGroupedRole[]}
     */
    function getGroupedRolesOrDefault(guildId) {
        return getGroupedRoles(guildId) || (cache[guildId] = [])
    }

    /**
     * @param {Discord.Snowflake} guildId 
     * @param {Discord.Snowflake} roleId 
     * @returns {IGroupedRole | undefined}
     */
    function getGroupedRole(guildId, roleId) {
        return getGroupedRolesOrDefault(guildId).find(it => it.getRoleId() == roleId)
    }

    /**
     * @param {Discord.Snowflake} guildId 
     * @param {IGroupedRole} groupedRole 
     * @returns {boolean} whether it was added
     */
    function addGroupedRole(guildId, groupedRole) {
        const guildCache = getGroupedRolesOrDefault(guildId)
        const existingRole = getGroupedRole(guildId, groupedRole.getRoleId())
        if (existingRole) return false
        guildCache.push(groupedRole)
    }

    /**
     * 
     * @param {Discord.Snowflake} guildId 
     * @param {Discord.Snowflake} roleId 
     * @returns {IGroupedRole | undefined} 
     */
    function removeGroupedRole(guildId, roleId) {
        const guildCache = getGroupedRolesOrDefault(guildId)
        let found;
        cache[guildId] = guildCache.filter(it => {
            if (it.getRoleId() == roleId) {
                found = it
                return false
            }
            return true
        })
        return found
    }
}
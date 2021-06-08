//@ts-check

const client = require("../bot").client
const rgbUtil = require("../util/rgbutil")

const db = require("./roledb")

/**@type {Object.<string, ColorRole[]>} */
const colorRoles = {}
/** 
 * @param {string} guildId 
 * @returns {Promise<ColorRole[]>}
 */
async function getColorRoles(guildId) {
    const existingRoles = colorRoles[guildId]
    if (!existingRoles) {
        const newRoles = await filterValidRoles(guildId, await db.getGuildRoles(guildId))
        colorRoles[guildId] = newRoles
        return newRoles
    }
    return existingRoles
}

/**
 * Filter out roles that no longer exist within
 * the guild or that their users have left
 * 
 * @param {ColorRole[]} roles 
 * @returns {Promise<ColorRole[]>}
 */
async function filterValidRoles(guildId, roles) {
    const guild = client.guilds.cache.get(guildId)
    if (!guild) return []

    const invalidRoles = [] // roles to invalidate [remove from database]
    /**@type {ColorRole[]} */
    const validRoles = []
    for (let k in roles) {
        const role = roles[k]

        const guildRole = guild.roles.cache.get(role.roleId)
        if (!guildRole) {
            invalidRoles.push(role)
            continue
        }

        const user = await client.users.fetch(role.roleOwner)
        try {
            const member = await guild.members.fetch(user)
            if (!member.roles.cache.has(guildRole.id)) {
                console.log("Found user that no longer has their role " + guildId)
                invalidRoles.push(role)

                guildRole.delete().catch(e => {
                    console.error("Unable to delete role with no assigned user")
                    console.error(e)
                })
                continue
            }

        } catch (e) {
            invalidRoles.push(role)
            console.log("Found role with no associated user [they left the guild?]")
            guildRole.delete().catch(e => {
                console.error("Unable to delete role with no user")
                console.error(e)
            })
            continue
        }
        validRoles.push(role)
    }

    if (invalidRoles.length > 0) await db.unregisterRoles(guildId, ...invalidRoles.map(it => it.roleOwner))

    return validRoles
}

/**
 * 
 * @param {string} guildId 
 * @param {string} userId 
 * @returns {Promise<ColorRole|null>}
 */
async function getColorRole(guildId, userId) {
    const found = (await getColorRoles(guildId)).filter(it => it.roleOwner == userId)
    if (found.length == 0) return null
    return found[0]
}

/**
 * 
 * @param {string} guildId 
 * @param {string} color 
 * @returns {Promise<ColorRole[]>}
 */
async function getRolesWithColor(guildId, color) {
    const guild = client.guilds.cache.get(guildId)
    if (!guild) return []
    const colorCompare = color.toLowerCase()

    return (await getColorRoles(guildId)).filter(colorRole => {
        const role = guild.roles.cache.get(colorRole.roleId)
        if (!role) return false
        const roleColor = role.hexColor.substring(1, role.hexColor.length)

        return roleColor.toLowerCase() == colorCompare
    })
}

/**
 * @param {string} guildId 
 * @param {string} userId 
 * @param {string} roleId
 */
async function registerColorRole(guildId, userId, roleId) {
    const roles = await getColorRoles(guildId)
    roles.push({
        roleId,
        roleOwner: userId,
        deleting: undefined
    })
    await db.registerNewRole(guildId, roleId, userId)
}

/**
 * 
 * @param {string} guildId 
 * @param {string} userId 
 */
async function unregisterColorRole(guildId, userId) {
    const roles = (await getColorRoles(guildId)).filter(it => it.roleOwner != userId)
    colorRoles[guildId] = roles
    await db.unregisterRoles(guildId, userId)
}

/**
 * 
 * @param {string} guildId 
 * @param  {...string} userIds 
 */
async function unregisterMultipleColorRoles(guildId, ...userIds) {
    const roles = (await getColorRoles(guildId)).filter(it => userIds.filter(u => u == it.roleOwner).length == 0)
    colorRoles[guildId] = roles
    await db.unregisterRoles(guildId, ...userIds)
}

module.exports = {
    getColorRoles,
    getColorRole,
    registerColorRole,
    getRolesWithColor,
    unregisterColorRole,
    unregisterMultipleColorRoles
}
//@ts-check

const Discord = require("discord.js")

const client = require("../bot").client
const rgbUtil = require("../util/rgbutil")
const roleStore = require("./rolestore")
const roleDB = require("./roledb")

/**
 * 
 * @param {string} guildId 
 * @param {string} name
 * @param {string} userId 
 * @param {rgbUtil.RGBColor} roleColor 
 */
async function createColorRole(guildId, name, userId, roleColor) {
    const guild = client.guilds.get(guildId)
    if (!guild) throw "Guild not found"
    const user = await client.fetchUser(userId)
    const member = await guild.fetchMember(user)

    const role = await guild.createRole({
        color: [roleColor.r, roleColor.g, roleColor.b],
        mentionable: false,
        name
    }, "User color role")
    try {
        await member.addRole(role, "User color role")
    } catch (e) {
        role.delete().catch(e => {
            console.error("Unable to delete unused role")
            console.error(e)
        })
        throw e
    }
    await roleStore.registerColorRole(guildId, userId, role.id)
}

/**
 * 
 * @param {string} guildId 
 * @param {string} userId 
 */
async function removeColorRole(guildId, userId) {
    const role = await roleStore.getColorRole(guildId, userId)
    if (role) {
        const guild = client.guilds.get(guildId)
        if (!guild) throw "Guild not found"
        const guildRole = guild.roles.get(role.roleId)
        if (guildRole) {
            role.deleting = true
            try {
                await guildRole.delete("Removing user color role")
            } catch (e) {
                role.deleting = false
                throw e
            }
        }
        await roleStore.unregisterColorRole(guildId, userId)
    }
}

/**
 * 
 * @param {string} guildId 
 * @param  {...roleStore.ColorRole} roles
 */
async function removeMultipleColorRoles(guildId, ...roles) {

    const guild = client.guilds.get(guildId)
    if (!guild)  // guild doesn't exist, role all
        return await roleStore.unregisterMultipleColorRoles(guildId, ...roles.map(it => it.roleOwner))

    const toRemove = []
    for (let k in roles) {
        const role = roles[k]
        const guildRole = await guild.roles.get(role.roleId)
        if (guildRole) {
            role.deleting = true
            try {
                await guildRole.delete("Removing user color role")
            } catch (e) {
                role.deleting = false
                console.error("Unable to delete associated color role, skipping removal from database")
                console.error(e)
                continue // don't remove from DB since the role still exists
            }
        }
        toRemove.push(role)
    }
    return await roleStore.unregisterMultipleColorRoles(guildId, ...toRemove.map(it => it.roleOwner))
}

/**
 * 
 * @param {string} guildId 
 * @param {string} userId 
 * @param {rgbUtil.RGBColor} newColor 
 */
async function changeColorRoleColor(guildId, userId, newColor) {
    const guild = client.guilds.get(guildId)
    if (!guild) throw "Guild doesn't exist"

    const role = await roleStore.getColorRole(guildId, userId)
    if (!role) throw "No existing color role"

    const guildRole = guild.roles.get(role.roleId)
    if (!guildRole) {
        await roleStore.unregisterColorRole(guildId, userId)
        throw "No guild role associated with color role"
    }
    await guildRole.setColor(newColor.hexColor(), "Changing user color role's color")
}

/**
 * 
 * @param {Discord.Client} client 
 */
async function setup(client) {
    client.on("roleDelete", require("./handler/roledeleted"))
    client.on("guildMemberRemove", require("./handler/userquit"))
    client.on("guildMemberUpdate", require("./handler/memberupdate"))
    return roleDB.ready
}

module.exports = {
    setup,
    createColorRole,
    removeColorRole,
    removeMultipleColorRoles,
    changeColorRoleColor
}
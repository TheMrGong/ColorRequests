//@ts-check

const Discord = require("discord.js")

import bot from "../bot"

const rgbUtil = require("../util/rgbutil")
import roleStore from "./rolestore"
const roleDB = require("./roledb")

import discordUtil from "../util/discordutil"

import userQuit from "./handler/userquit"
import memberUpdate from "./handler/memberupdate"
import roleDeleted from "./handler/roledeleted"

/**
 * 
 * @param {Discord.Snowflake} guildId 
 * @param {string} name
 * @param {Discord.Snowflake} userId 
 * @param {rgbUtil.RGBColor} roleColor 
 */
async function createColorRole(guildId, name, userId, roleColor) {
    const guild = bot.client.guilds.cache.get(guildId)
    if (!guild) throw "Guild not found"

    // ensure roles are up to date before trying to resort guild roles
    await guild.roles.fetch()
    const user = bot.client.users.cache.get(userId)
    const member = await guild.members.fetch(user)


    const role = await guild.roles.create({
        color: [roleColor.r, roleColor.g, roleColor.b],
        mentionable: false,
        name,
        permissions: [],
        reason: "User color role"
    })

    // fetch this after creating the role
    const priortyAbove = discordUtil.findHighestColorPriority(member)

    if (priortyAbove != 0) // check if they even HAVE a role
        try {
            await role.setPosition(priortyAbove)
        } catch (e) {
            await role.delete()
            throw "User has too high of a role to give a color: " + e
        }
    try {
        await member.roles.add(role, "User color role")
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
 * @param {Discord.Snowflake} guildId 
 * @param {Discord.Snowflake} userId 
 */
async function removeColorRole(guildId, userId) {
    const role = await roleStore.getColorRole(guildId, userId)
    if (role) {
        const guild = bot.client.guilds.cache.get(guildId)
        if (!guild) throw "Guild not found"
        const guildRole = await guild.roles.fetch(role.roleId) // fetch since this is important
        if (guildRole && !role.deleting) {
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
 * @param {Discord.Snowflake} guildId 
 * @param  {...ColorRole} roles
 */
async function removeMultipleColorRoles(guildId, ...roles) {

    const guild = bot.client.guilds.cache.get(guildId)
    if (!guild)  // guild doesn't exist, role all
        return await roleStore.unregisterMultipleColorRoles(guildId, ...roles.map(it => it.roleOwner))

    const toRemove = []
    for (let k in roles) {
        const role = roles[k]
        const guildRole = await guild.roles.fetch(role.roleId)
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
 * @param {Discord.Snowflake} guildId 
 * @param {Discord.Snowflake} userId 
 * @param {rgbUtil.RGBColor} newColor 
 */
async function changeColorRoleColor(guildId, userId, newColor) {
    const guild = bot.client.guilds.cache.get(guildId)
    if (!guild) throw "Guild doesn't exist"

    const user = bot.client.users.cache.get(userId)
    const member = await guild.members.fetch(user)


    const role = await roleStore.getColorRole(guildId, userId)
    if (!role) throw "No existing color role"


    const guildRole = await guild.roles.fetch(role.roleId)
    if (!guildRole) {
        await roleStore.unregisterColorRole(guildId, userId)
        throw "No guild role associated with color role"
    }

    let priortyAbove = 0;
    member.roles.cache.forEach(theRoles => {
        if (theRoles.color != 0 && theRoles.id != role.roleId && theRoles.position > priortyAbove)
            priortyAbove = theRoles.position
    })

    if (priortyAbove >= guildRole.position) {
        try {
            // ensure roles up to date before trying to resort
            await guildRole.guild.roles.fetch()
            await guildRole.setPosition(priortyAbove)
        } catch (e) {
            console.error("Unable to update old role to use higher position")
        }
    }
    await guildRole.setColor(newColor.hexColor(), "Changing user color role's color")
}

/**
 * 
 * @param {Discord.Client} client 
 */
async function setup(client) {
    client.on("roleDelete", roleDeleted)
    client.on("guildMemberRemove", userQuit)
    client.on("guildMemberUpdate", memberUpdate)

    for(const [k, guild] of client.guilds.cache.entries()) {
        await roleStore.getColorRoles(k) // pre-cache all current guilds
    }
    return roleDB.ready
}

export default {
    setup,
    createColorRole,
    removeColorRole,
    removeMultipleColorRoles,
    changeColorRoleColor
}
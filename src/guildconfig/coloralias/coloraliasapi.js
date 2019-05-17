//@ts-check

const defaultAliases = require("./defaultalias")

/**
 * @typedef ColorAlias
 * @property {string} name
 * @property {rgbUtil.RGBColor} color
 */

// key is guild id
/**@type {Object.<string, ColorAlias[]>} */
const colorAliases = {}

const rgbUtil = require("../../util/rgbutil")
const db = require("./coloraliasdb")

/**
 * 
 * @param {string} guildId 
 * @returns {Promise<ColorAlias[]>}
 */
async function getColorAliases(guildId) {
    const existingAliases = colorAliases[guildId]
    if (!existingAliases) {
        let newAliases = await db.getColorAliases(guildId)
        if (newAliases == null) { // setup default aliases if null
            newAliases = defaultAliases.slice(0)
            await db.addMultiColors(guildId, defaultAliases)
            console.log("Set up default aliases for guild " + guildId + "(" + defaultAliases.length + ")")
        }
        colorAliases[guildId] = newAliases
        return newAliases
    }
    return existingAliases
}

/**
 * @param {string} guildId 
 * @param {string} name 
 * @returns {Promise<ColorAlias | null>}
 */
async function getColorAlias(guildId, name) {
    name = name.toLowerCase()
    const aliases = await getColorAliases(guildId)
    const found = aliases.filter(it => it.name == name)
    if (found.length == 0) return null
    return found[0]
}

/**
 * Adds a new color alias or updates an existing one
 * 
 * @param {string} guildId 
 * @param {string} name 
 * @param {rgbUtil.RGBColor} color
 */
async function addColorAlias(guildId, name, color) {
    name = name.toLowerCase()
    const existing = await getColorAlias(guildId, name)

    if (!existing) {
        const colorAliases = await getColorAliases(guildId)
        colorAliases.push({ name, color })
    } else existing.color = color

    await db.addOrUpdateColorAlias(guildId, name, color)
}

/**
 * @param {string} guildId 
 * @param {string} name 
 */
async function removeColorAlias(guildId, name) {
    name = name.toLowerCase()
    const existing = await getColorAlias(guildId, name)
    if (existing) {
        colorAliases[guildId] = (await getColorAliases(guildId)).filter(it => it.name != name)
        await db.removeColorAlias(guildId, name)
    }
}


module.exports = {
    ready: db.ready,
    getColorAliases,
    getColorAlias,
    addColorAlias,
    removeColorAlias
}

//@ts-check

/**@typedef {import("./coloraliasapi.js").ColorAlias} ColorAlias */

import rgbFromHex from "../../util/rgbutil"

/**@type {ColorAlias[]} */
const defaultAliases = fromObjects([
    {
        name: "aqua",
        color: "#1abc9c"
    },
    {
        name: "green",
        color: "#2ecc71"
    },
    {
        name: "blue",
        color: "#3498db"
    },
    {
        name: "purple",
        color: "#9b59b6"
    },
    {
        name: "pink",
        color: "#e91e63"
    },
    {
        name: "yellow",
        color: "#f1c40f"
    },
    {
        name: "orange",
        color: "#e67e22"
    },
    {
        name: "red",
        color: "#e74c3c"
    },
    {
        name: "gray",
        color: "#95a5a6"
    },
    {
        name: "bluegrey",
        color: "#607d8b"
    },
    {
        name: "dark-aqua",
        color: "#11806a"
    },
    {
        name: "dark-green",
        color: "#1f8b4c"
    },
    {
        name: "dark-blue",
        color: "#206694"
    },
    {
        name: "dark-purple",
        color: "#71368a"
    },
    {
        name: "dark-pink",
        color: "#ad1457"
    },
    {
        name: "dark-yellow",
        color: "#c27c0e"
    },
    {
        name: "dark-orange",
        color: "#a84300"
    },
    {
        name: "dark-red",
        color: "#992d22"
    },
    {
        name: "dark-gray",
        color: "#979c9f"
    },
    {
        name: "dark-bluegrey",
        color: "#546e7a"
    }
])

/**
 * 
 * @param {any[]} obj 
 * @returns {ColorAlias[]} 
 */
function fromObjects(obj) {
    /**@type {ColorAlias[]} */
    const aliases = []
    obj.forEach(o => {
        const rgb = rgbFromHex(o.color)
        if (!rgb) console.warn("Unable to decode default color '" + o.color + "'")
        else aliases.push({
            name: o.name,
            color: rgb
        })
    })
    return aliases
}

module.exports = defaultAliases
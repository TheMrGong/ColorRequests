//@ts-check

const Discord = require("discord.js")
const hexToRgb = require("../../util/rgbutil")
const config = require("../../config")

const requestApi = require("../requestapi")

/**
* 
* @param {Discord.Message} message 
*/
module.exports = (message) => {

    if (!message.content.startsWith(config.prefix)) return;

    const spaces = message.content.split(" ");
    const cmd = spaces[0].toLowerCase().substring(1, spaces[0].length).replace(/[^\w]/gm, "")
    const args = [];
    for (let k in spaces) {
        if (parseInt(k) > 0) args.push(spaces[k]);
    }

    if (cmd.toLowerCase() == "colorrequest") {
        if (args.length == 0) {
            message.channel.send("Usage: " + config.preifx + "colorrequest #ffffff")
            return
        }

        const rgb = hexToRgb(args[0])
        if (!rgb) message.channel.send("Unable to determine RGB from hex.")
        else requestApi.handleNewRequest(message, rgb)
    }
}
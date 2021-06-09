//@ts-check

const Discord = require("discord.js")
const config = require("./config")

import guildConfigs from "./guildconfig/guildconfigs"
import requestApi from "./requests/requestapi"
import roleApi from "./colorroles/roleapi"

export const client = new Discord.Client({
    intents: [`GUILDS`, `GUILD_MESSAGES`]
})

async function start() {

    console.log("Logging in...")
    await client.login(config.token)
    console.log("Logged in")

    await guildConfigs.setup(client)
    await requestApi.setup(client)
    await roleApi.setup(client)
}

client.on("error", err => {
    console.error("Discord got an error")
    console.error(err)
})

export default {
    start,
    client
}
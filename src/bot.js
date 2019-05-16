//@ts-check

const Discord = require("discord.js")
const config = require("./config")

const client = new Discord.Client()

const setup = [
    "./guildconfig/guildconfigs",
    "./requests/requestapi"
]

async function botStart() {

    console.log("Logging in...")
    await client.login(config.token)
    console.log("Logged in")
    setup.forEach(api => require(api).setup(client))
}

client.on("error", err => {
    console.error("Discord got an error")
    console.error(err)
})

module.exports = {
    start: botStart,
    client
}
const bot = require("./bot")

bot.start().then(() => {
    console.log("ColorRequests bot ready.")
}).catch(err => {
    console.log()
    console.error("Error beginning: ")
    console.error(err)
    console.log()

    process.emit("SIGINT", "SIGINT")
})

process.on("SIGINT", async () => {
    //graceful shutdown
    console.log("Logging off..")
    await bot.client.destroy()

    console.log("Logged off")
    process.exit()
});

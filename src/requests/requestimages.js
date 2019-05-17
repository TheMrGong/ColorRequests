//@ts-check

const { AnimationContext } = require("../util/graphics/animatorutil")
const gifUtil = require("../util/graphics/gifutil")
const canvasAPI = require("canvas")
const path = require("path")

const FPS = 20
const DURATION = 1000 * 6
const WIDTH = 380
const HEIGHT = 70

const requestApi = require("./requestapi")

canvasAPI.registerFont("./font/Whitney Medium.ttf", { family: "Whitney-Medium" })
canvasAPI.registerFont("./font/Whitney Book.ttf", { family: "Whitney-Book" })


const ACCEPT_EMOJI = "✅"
const DECLINE_EMOJI = "⛔"

/**
 * 
 * @param {string} userName 
 * @param {string} newColor 
 * @returns {Promise<Buffer>}
 */
async function generateChangeImage(userName, profileURL, newColor) {
    const profileAnimator = await gifUtil.createURLImageDrawer(profileURL, {
        width: 40,
        height: 40
    })
    const context = new AnimationContext(FPS, DURATION, WIDTH, HEIGHT, (f) => {
        f.ctx.fillStyle = newColor
        f.ctx.font = f.ctx.font = "16px Whitney-Medium"

        f.ctx.save()
        const radius = 20
        f.ctx.arc(radius, radius + 20, radius, 0, 2 * Math.PI)
        f.ctx.clip()
        profileAnimator.draw(f, 0, 20, 40, 40)
        f.ctx.restore()

        f.ctx.fillText(userName, 50, 20)
        const exampleText = `${ACCEPT_EMOJI} to accept this color, ${DECLINE_EMOJI} to decline`

        f.ctx.fillStyle = "#dcddde"

        const info = f.ctx.measureText(userName)

        //frame.ctx.font = frame.ctx.font = "15px Whitney-Book"
        f.ctx.font = f.ctx.font = "15px Whitney-Book"
        f.ctx.fillText(exampleText, 50, 20 + info.emHeightAscent + 5)
    })
    context.backgroundColor = "#36393f"
    return await context.generateGif()
}

module.exports = {
    generateChangeImage
}
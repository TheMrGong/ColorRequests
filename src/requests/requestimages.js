//@ts-check

const Discord = require("discord.js")
/**@typedef {import("../guildconfig/coloralias/coloraliasapi").ColorAlias} ColorAlias  */

const { AnimationContext } = require("../util/graphics/animatorutil")
const gifUtil = require("../util/graphics/gifutil")
const canvasAPI = require("canvas")
const hsv = require("rgb-hsv")

const changePreviewProps = {
    fps: 1,
    duration: 1,
    width: 380,
    height: 70
}

const aliasPreviewProps = {
    fps: 1,
    duration: 1,
    width: 600,
    height: 200
}

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
    const context = new AnimationContext(changePreviewProps.fps,
        changePreviewProps.duration,
        changePreviewProps.width,
        changePreviewProps.height, (f) => {
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

/**
 * 
 * @param {Discord.Guild} guild 
 * @param {ColorAlias[]} aliases
 * @returns {Promise<Buffer>} 
 */
async function generateAliasHelp(guild, aliases) {
    const getHue = (alias) => hsv(alias.color.r, alias.color.g, alias.color.b)[0]
    aliases = aliases.sort((a, b) => getHue(a) - getHue(b))
    const guildIconSize = 48
    const guildIconDrawer = guild.iconURL ? await gifUtil.createURLImageDrawer(guild.iconURL, {
        width: guildIconSize
    }) : null

    const aliasSquareSize = 20 // size of square representing the color
    const aliasTextPadding = 5 // padding between color and name

    const aliasPadding = 10 // padding to the right of the ([color] name)

    const aliasFont = "20px Whitney-Book"

    const context = new AnimationContext(aliasPreviewProps.fps,
        aliasPreviewProps.duration,
        aliasPreviewProps.width,
        aliasPreviewProps.height,
        f => {

            /** 
             * @param {ColorAlias} alias
             * @returns {number}
             */
            function getAliasWidth(alias) {
                f.ctx.save()
                f.ctx.font = f.ctx.font = aliasFont
                let sizing = f.ctx.measureText(alias.name)
                f.ctx.restore()

                return aliasSquareSize + aliasTextPadding + sizing.width + aliasPadding
            }
            /**@param {ColorAlias} alias*/
            function drawAlias(alias, x, y) {
                f.ctx.fillStyle = "#" + alias.color.hexColor()
                f.ctx.fillRect(x, y, aliasSquareSize, aliasSquareSize)
                f.ctx.font = f.ctx.font = aliasFont
                let sizing = f.ctx.measureText(alias.name)
                f.ctx.fillText(alias.name, x + aliasSquareSize + aliasTextPadding, y + sizing.emHeightAscent)
            }

            if (guildIconDrawer) guildIconDrawer.draw(f, 0, 0, guildIconSize, guildIconSize)
            else {
                f.ctx.save()
                f.ctx.font = f.ctx.font = "30px Whitney-Medium"
                f.ctx.fillStyle = "#ffffff"
                const measure = f.ctx.measureText(guild.nameAcronym)
                f.ctx.fillText(guild.nameAcronym, 0, measure.emHeightAscent)
                f.ctx.restore()
            }
            f.ctx.font = f.ctx.font = "25px Whitney-Medium"
            const text = `${guild.name}'s Preapproved Colors`
            const measure = f.ctx.measureText(text)
            f.ctx.fillStyle = "#ffffff"
            f.ctx.fillText(text, guildIconSize + 10, measure.emHeightAscent)

            const startX = 10
            const offsetY = 30
            let curX = startX
            let curY = guildIconSize + 10


            for (let k in aliases) {
                const alias = aliases[k]
                const width = getAliasWidth(alias)
                if (curX + width > f.animation.width + aliasPadding) {
                    curX = startX
                    curY += offsetY
                }
                drawAlias(alias, curX, curY)
                curX += width
            }
        })
    context.backgroundColor = "#36393f"

    return await context.generateGif()
}

module.exports = {
    generateChangeImage,
    generateAliasHelp
}
//@ts-check

import Discord from "discord.js"
import { UserContext } from "../../util/discordutil"

const requestApi = require("../requestapi")
const colorAlias = require("../../guildconfig/coloralias/coloraliasapi")

/**
 * @param {Discord.Interaction} interaction 
 */
async function handleInteraction(interaction) {
    if (!interaction.isMessageComponent()) {
        return
    }
    if(interaction.customID.startsWith(`color;`)) {
        const requestedColor = interaction.customID.substring(`color;`.length)
        const alias = await colorAlias.getColorAlias(interaction.guild.id, requestedColor)
        if (alias) {
            await interaction.defer({
                ephemeral: true,
            })
            await requestApi.handleNewRequest(await UserContext.ofInteraction(interaction), alias.color)
        } else {
            await interaction.reply({
                content: `Unknown color`,
                ephemeral: true,
            })
        }
        
    }
}

/**
 * 
 * @param {Discord.Interaction} interaction 
 */
export default function onInteraction(interaction) {
    handleInteraction(interaction).catch((e) => {
        console.error(`Failed to handle interaction`)
        console.error(e)
    })
}
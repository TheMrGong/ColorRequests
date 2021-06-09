//@ts-check

import Discord from "discord.js"
import { UserContext } from "../../util/discordutil"

const requestApi = require("../requestapi")
const colorAlias = require("../../guildconfig/coloralias/coloraliasapi")

/**
 * 
 * @param {Discord.Interaction} interaction 
 */
export default async function onInteraction(interaction) {
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
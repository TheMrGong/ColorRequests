//@ts-check
const Discord = require("discord.js")

/**
 * 
 * @param {Discord.GuildMember} member 
 * @returns {number}
 */
function findHighestColorPriority(member) {
    return member.roles.cache.filter(it => it.color != 0).map(it => it.position).sort((b1, b2) => b2 - b1).shift() || 0
}

/**
 * @param {string} id 
 * @returns {Discord.Snowflake}
 */
export function idToFlake(id) {
    //@ts-ignore
    return id
}

export class UserContext {
    /**
     * @param {Discord.Guild} guild 
     * @param {Discord.GuildMember} member 
     */
    constructor(guild, member) {
        this.guild = guild
        this.member = member
    }

    /**
     * @param {string | Discord.MessageOptions & { split?: false; }} message 
     */
    async sendMessage(message) {
        throw new Error(`Not implemented`)
    }

    async delete() {
        return Promise.resolve()
    }

    /**
     * @param {Discord.Message} message 
     */
    static async ofMessage(message) {
        if(!(message.channel instanceof Discord.TextChannel)) {
            throw new Error(`Only supports text channels`)
        }
        let member = message.member
        if(!member) {
            member = await message.guild.members.fetch(message.author)
        }
        return new MessageUserContext(message.guild, member, message.channel, message)
    }

    /**
     * @param {Discord.Interaction} interaction 
     */
    static async ofInteraction(interaction) {
        const member = await interaction.guild.members.fetch(interaction.user)

        return new InteractionUserContext(interaction.guild, member, interaction)
    }
}

class MessageUserContext extends UserContext {
    /**
     * @param {Discord.Guild} guild 
     * @param {Discord.GuildMember} member 
     * @param {Discord.TextChannel} channel 
     * @param {Discord.Message} message
     */
    constructor(guild, member, channel, message) {
        super(guild, member)
        this.channel = channel
        this.message = message
    }

    /**
     * @param {string | Discord.MessageOptions & { split?: false; }} message 
     */
    async sendMessage(message) {
        await this.channel.send(message)
    }

    async delete() {
        if(this.message.deletable) {
            await this.message.delete()
        }
    }

}

class InteractionUserContext extends UserContext {
    /**
     * @param {Discord.Guild} guild 
     * @param {Discord.GuildMember} member 
     * @param {Discord.Interaction} interaction
     */
     constructor(guild, member, interaction) {
        super(guild, member)
        this.interaction = interaction
    }

    /**
     * @param {string | Discord.MessageOptions & { split?: false; }} message 
     */
    async sendMessage(message) {
        const msg = typeof message === `string` ? {
            content: message
        } : message
        if(this.interaction.isCommand() || this.interaction.isMessageComponent()) {
            if(this.interaction.deferred) {
                await this.interaction.editReply({
                    ...msg,
                })
            } else if(this.interaction.replied) {
                await this.interaction.followUp({
                    ...msg,
                    ephemeral: true,
                })
            } else {
                await this.interaction.reply({
                    ...msg,
                    ephemeral: true,
                })
            }
            
        }
    }
}

export default {
    findHighestColorPriority
}
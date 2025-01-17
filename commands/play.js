const { SlashCommandBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { createAudioPlayer, createAudioResource, joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('YouTubeのURLをボイスチャンネルで再生します')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('再生するYouTubeのURL')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const url = interaction.options.getString('url');
            const voiceChannel = interaction.member.voice.channel;

            if (!voiceChannel) {
                return await interaction.reply({
                    content: 'まずボイスチャンネルに参加してください。',
                    ephemeral: true
                });
            }

            const distube = new DisTube();

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator
            });

            await interaction.reply({
                content: `再生中: ${url}`
            });

            const resource = createAudioResource(url);
            const player = createAudioPlayer();
            
        } catch (err) {

        }
    }
}

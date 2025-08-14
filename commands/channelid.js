const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelid')
        .setDescription('指定したチャンネルのIDを取得します')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('チャンネルを選択')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        // ユーザーが選択したチャンネルを取得
        const channel = interaction.options.getChannel('channel');

        // チャンネルIDを返信
        await interaction.reply(`チャンネル「${channel.name}」のIDは \`${channel.id}\` です。`);
        const commandName = interaction.commandName;
        const userId = interaction.user.id;
        const username = interaction.user.tag;
        const serverId = interaction.guild?.id || 'DM';
        const reportChannelId = '1354450815074439321';

        // ギルド内での実行時のみログを送信
        if (interaction.guild) {
          const reportChannel = await interaction.guild.channels.fetch(reportChannelId).catch(() => null);
          if (reportChannel) {
            // 成功ログをEmbedで送信
            const logEmbed = new EmbedBuilder()
              .setTitle('✅ コマンド実行成功')
              .setColor('Green')
              .addFields(
                { name: 'ユーザー', value: `${username} (${userId})`, inline: false },
                { name: 'サーバーID', value: `${serverId}`, inline: false },
                { name: 'コマンド', value: `/${commandName}`, inline: false },
                { name: '結果', value: '✅ 成功', inline: false }
              )
              .setTimestamp();

            await reportChannel.send({ embeds: [logEmbed] });
          }
        }
    },
};

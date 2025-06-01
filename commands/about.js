const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('ボットの情報を表示します'),
  async execute(interaction) {
    try {
      const aboutEmbed = new EmbedBuilder()
        .setColor(0x00ff00) // 緑色
        .setTitle('ボット情報')
        .setDescription('このボットの詳細情報をご確認ください。')
        .addFields(
          { name: '名前', value: 'Clystal Bot', inline: true },
          { name: 'バージョン', value: '1.9.0', inline: true },
          { name: '作者', value: 'Oruger', inline: true },
          { name: '公式ホームページ', value: '[公式ホームページはこちら](https://oruger-0730.github.io/clystal_bot-home-page/)', inline: false },
          { name: 'サポート', value: '[サポートサーバーに参加](https://discord.gg/Kn47Ktqe9w)', inline: false },
        )
        .setFooter({ text: 'Clystal Bot | Powered by Discord.js', iconURL: 'https://i.imgur.com/AfFp7pu.png' })
        .setTimestamp();

      await interaction.reply({ embeds: [aboutEmbed] });

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
        } else {
          console.warn(`ログチャンネル (${reportChannelId}) が見つかりません。`);
        }
      }
    } catch (error) {
      console.error('エラー: /about コマンドの実行中に問題が発生しました', error);

      // すでに `interaction.reply()` されているかを確認
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '情報の取得中にエラーが発生しました。もう一度お試しください。',
          ephemeral: true,
        });
      }

      const commandName = interaction.commandName;
      const userId = interaction.user.id;
      const username = interaction.user.tag;
      const serverId = interaction.guild?.id || 'DM';
      const reportChannelId = '1354450815074439321';

      if (interaction.guild) {
        const reportChannel = await interaction.guild.channels.fetch(reportChannelId).catch(() => null);
        if (reportChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('❌ コマンド実行エラー')
            .setColor('Red')
            .addFields(
              { name: 'ユーザー', value: `${username} (${userId})`, inline: false },
              { name: 'サーバーID', value: `${serverId}`, inline: false },
              { name: 'コマンド', value: `/${commandName}`, inline: false },
              { name: '結果', value: `❌ エラー\n\`\`\`${error.message || error}\`\`\``, inline: false }
            )
            .setTimestamp();
          await reportChannel.send({ embeds: [logEmbed] });
        }
      }
    }
  },
};
const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const fs = require('node:fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('利用可能なコマンド一覧を表示します'),
  async execute(interaction) {
    try {
      const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

      const fields = [];

      for (const file of commandFiles) {
        const command = require(`./${file}`);
        if (command.data && command.data.name && command.data.description) {
          fields.push({
            name: `/${command.data.name}`,
            value: command.data.description,
            inline: true,
          });
        }
      }

      // ページ分割（25個ずつ）
      const pageSize = 15;
      const pages = [];
      for (let i = 0; i < fields.length; i += pageSize) {
        pages.push(fields.slice(i, i + pageSize));
      }

      let currentPage = 0;

      const getEmbed = (pageIndex) => {
        return new EmbedBuilder()
          .setColor('Green')
          .setTitle('📜 Bot ヘルプ')
          .setDescription('以下は現在利用可能なコマンドの一覧です:')
          .addFields(pages[pageIndex])
          .setFooter({ text: `ページ ${pageIndex + 1}/${pages.length} • 各コマンドの詳細は /コマンド名 を実行してください` })
          .setTimestamp();
      };

      const getRow = (disabled = false) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('次へ')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled || pages.length <= 1)
        );
      };

      const message = await interaction.reply({
        embeds: [getEmbed(currentPage)],
        components: [getRow()],
        fetchReply: true
      });

      const collector = message.createMessageComponentCollector({
        time: 5 * 60 * 1000 // 5分
      });

      collector.on('collect', async i => {
        if (i.customId === 'next') {
          currentPage = (currentPage + 1) % pages.length;
          await i.update({
            embeds: [getEmbed(currentPage)],
            components: [getRow()]
          });
        }
      });

      collector.on('end', async () => {
        await message.edit({
          components: [getRow(true)]
        });
      });

    } catch (error) {
      console.error('エラーが発生しました:', error);
      await interaction.reply({
        content: 'コマンド一覧の取得中にエラーが発生しました。',
        ephemeral: true,
      });
    }
  }
};

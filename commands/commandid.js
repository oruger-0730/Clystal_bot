const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("commandids")
    .setDescription("Botに登録されているコマンドのID一覧をページ付きで表示します"),

  async execute(interaction) {
    const commands = await interaction.client.application.commands.fetch();
    const itemsPerPage = 25;
    const pages = [];

    for (let i = 0; i < commands.size; i += itemsPerPage) {
      const chunk = [...commands.values()].slice(i, i + itemsPerPage);
      const fields = chunk.map(cmd => ({
        name: `/${cmd.name}`,
        value: `ID: \`${cmd.id}\``,
        inline: true,
      }));
      pages.push(fields);
    }

    let currentPage = 0;

    const getEmbed = (pageIndex) => {
      return new EmbedBuilder()
        .setTitle("🧾 登録コマンド一覧")
        .setDescription("各コマンドのIDを表示しています")
        .addFields(pages[pageIndex])
        .setFooter({ text: `ページ ${pageIndex + 1} / ${pages.length}` })
        .setColor("Blurple")
        .setTimestamp();
    };

    const getButtons = () => new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('前へ')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('次へ')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === pages.length - 1),
    );

    const reply = await interaction.reply({
      embeds: [getEmbed(currentPage)],
      components: [getButtons()]
    });

    const collector = reply.createMessageComponentCollector({
      time: 5 * 60 * 1000 // 5分
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: "このボタンはあなた専用です。", ephemeral: true });
      }

      if (i.customId === 'prev') currentPage--;
      else if (i.customId === 'next') currentPage++;

      await i.update({
        embeds: [getEmbed(currentPage)],
        components: [getButtons()],
      });
    });

    collector.on('end', async () => {
      if (reply.editable) {
        await reply.edit({
          components: []
        });
      }
    });
  }
};
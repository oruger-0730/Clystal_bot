const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bug')
    .setDescription('バグ報告用モーダルを開きます'),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId('bugReportModal')
      .setTitle('バグ報告フォーム');

    const commandInput = new TextInputBuilder()
      .setCustomId('executedCommand')
      .setLabel('実行したコマンド')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('/example')
      .setRequired(true);

    const issueInput = new TextInputBuilder()
      .setCustomId('issueDescription')
      .setLabel('どんな問題が発生しましたか？')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('問題の詳細を教えてください。')
      .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(commandInput);
    const row2 = new ActionRowBuilder().addComponents(issueInput);

    modal.addComponents(row1, row2);

    await interaction.showModal(modal);
  }
};


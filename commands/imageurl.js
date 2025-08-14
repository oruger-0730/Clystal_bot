const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('imageurl')
    .setDescription('添付された画像のURLを取得します')
    .addAttachmentOption(option =>
      option.setName('画像')
        .setDescription('URLを取得したい画像ファイル')
        .setRequired(true)
    ),

  async execute(interaction) {
    const image = interaction.options.getAttachment('画像');

    // 画像かどうかのチェック
    if (!image.contentType || !image.contentType.startsWith('image/')) {
      return interaction.reply({
        content: '⚠️ 有効な画像ファイルを指定してください。',
        ephemeral: true
      });
    }

    const aboutEmbed = new EmbedBuilder()
        .setColor(0x00ff00) // 緑色
        .setTitle('画像をURLに変換しました。')
        .setDescription(`\`\`\`${image.url}\`\`\``)
        .setTimestamp();

      await interaction.reply({ embeds: [aboutEmbed] });
  }
};

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Botがメッセージを送信します。')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('送信するメッセージ')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    const channel = interaction.channel;
    const botMember = interaction.guild.members.me;

    // Botがメッセージ送信権限を持っているか確認
    const hasPermission = channel
      .permissionsFor(botMember)
      .has(PermissionsBitField.Flags.SendMessages);

    if (hasPermission) {
      // 通常メッセージとしてチャンネルに送信
      await channel.send(message);

      // インタラクション返信（非表示）
      await interaction.reply({
        content: '✅ メッセージを送信しました。',
        ephemeral: true,
      });
    } else {
      // 権限がない場合の返信
      const embed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('❌ 送信失敗')
        .setDescription('Botにこのチャンネルでのメッセージ送信権限がありません。')
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
  },
};

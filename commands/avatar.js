const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('ユーザーのアバターを表示します')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('アバターを表示するユーザー')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

    await interaction.reply({
      embeds: [
        {
          color: 0x00AE86,
          title: `${user.username} のアバター`,
          image: { url: avatarUrl },
          footer: { text: `ユーザーID: ${user.id}` }
        }
      ]
    });
  }
};

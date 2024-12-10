const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// admin.jsonとblacklist.jsonのパス
const adminFilePath = path.join(__dirname, '../json/admin.json');
const blacklistFilePath = path.join(__dirname, '../json/blacklist.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('管理者専用のコマンドです')
    .addSubcommand(subcommand =>
      subcommand
        .setName('server')
        .setDescription('ボットが参加中のサーバーを表示します')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('leave')
        .setDescription('指定されたサーバーからボットを退出させます')
        .addStringOption(option =>
          option.setName('server_id')
            .setDescription('サーバーID')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('invite')
        .setDescription('指定されたサーバーの招待リンクを生成します')
        .addStringOption(option =>
          option.setName('server_id')
            .setDescription('サーバーID')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('member')
        .setDescription('管理者を追加します')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('管理者として追加するユーザー')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('blacklist')
        .setDescription('ユーザーまたはサーバーをブラックリストに登録します')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('ブラックリストのタイプ (user または server)')
            .setRequired(true)
            .addChoices(
              { name: 'ユーザー', value: 'user' },
              { name: 'サーバー', value: 'server' }
            )
        )
        .addStringOption(option =>
          option.setName('id')
            .setDescription('ユーザーIDまたはサーバーID')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reload')
        .setDescription('指定したコマンドをリロードします')
        .addStringOption(option =>
          option.setName('command_name')
            .setDescription('リロードするコマンドの名前')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const member = interaction.member;

    try {
      const adminData = JSON.parse(fs.readFileSync(adminFilePath, 'utf-8'));

      // 実行者が管理者かどうか確認
      if (!adminData.admins.includes(member.id)) {
        const errorEmbed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('権限エラー')
          .setDescription('このコマンドは管理者のみ実行できます。');
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      switch (subcommand) {
        case 'server':
          // サーバー表示処理
          const guilds = interaction.client.guilds.cache.map(guild => `**${guild.name}** (ID: ${guild.id})`).join('\n') || 'ボットは参加していません。';
          const serverEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('参加中のサーバー一覧')
            .setDescription(guilds);
          await interaction.reply({ embeds: [serverEmbed], ephemeral: true });
          break;

        case 'leave':
          // サーバー退出処理
          const serverId = interaction.options.getString('server_id');
          const guild = interaction.client.guilds.cache.get(serverId);

          if (!guild) {
            const errorEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('エラー')
              .setDescription('指定されたサーバーが見つかりません。');
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
          }

          await guild.leave();
          const successLeaveEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('サーバー退出成功')
            .setDescription(`${guild.name} サーバーから退出しました。`);
          await interaction.reply({ embeds: [successLeaveEmbed] });
          break;

        case 'reload':
          // コマンドリロード処理
          const commandName = interaction.options.getString('command_name');
          const commandPath = path.join(__dirname, `${commandName}.js`);

          if (!fs.existsSync(commandPath)) {
            const errorEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('エラー')
              .setDescription(`コマンド "${commandName}" が見つかりません。`);
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
          }

          // コマンドのキャッシュをクリア
          delete require.cache[require.resolve(commandPath)];

          try {
            const newCommand = require(commandPath);
            interaction.client.commands.set(newCommand.data.name, newCommand);

            const successReloadEmbed = new EmbedBuilder()
              .setColor('Green')
              .setTitle('コマンドリロード成功')
              .setDescription(`コマンド "${commandName}" を正常にリロードしました。`);
            await interaction.reply({ embeds: [successReloadEmbed] });
          } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('リロードエラー')
              .setDescription(`コマンド "${commandName}" のリロード中にエラーが発生しました。`);
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('エラー:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor('Red')
        .setTitle('エラー')
        .setDescription('コマンド実行中に問題が発生しました。');
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};

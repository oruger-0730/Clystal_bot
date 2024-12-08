const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// admin.jsonのパス
const adminFilePath = path.join(__dirname, '../json/admin.json');

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
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const member = interaction.member;

    try {
      // admin.jsonから管理者リストを読み込む
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
          // ボットが参加中のサーバーを表示
          const guilds = interaction.client.guilds.cache.map(guild => guild.name).join('\n') || 'ボットは参加していません。';
          const serverEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('参加中のサーバー一覧')
            .setDescription(guilds);
          await interaction.reply({ embeds: [serverEmbed], ephemeral: true });
          break;

        case 'leave':
          // サーバーIDを取得して退出
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

        case 'invite':
          // 招待リンクを生成
          const inviteServerId = interaction.options.getString('server_id');
          const inviteGuild = interaction.client.guilds.cache.get(inviteServerId);

          if (!inviteGuild) {
            const errorEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('エラー')
              .setDescription('指定されたサーバーが見つかりません。');
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
          }

          const invite = await inviteGuild.channels.cache.filter(c => c.type === 0).first().createInvite({ unique: true });
          const inviteEmbed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('サーバー招待リンク')
            .setDescription(`こちらが招待リンクです: [${invite.url}]`);
          await interaction.reply({ embeds: [inviteEmbed], ephemeral: true });
          break;

        case 'member':
          // 管理者の追加
          const user = interaction.options.getUser('user');

          // すでに管理者として登録されているか確認
          if (adminData.admins.includes(user.id)) {
            const errorEmbed = new EmbedBuilder()
              .setColor('Red')
              .setTitle('エラー')
              .setDescription(`${user.tag}は既に管理者です。`);
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
          }

          // 新しい管理者を追加
          adminData.admins.push(user.id);
          fs.writeFileSync(adminFilePath, JSON.stringify(adminData, null, 2));

          const successEmbed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('管理者追加成功')
            .setDescription(`${user.tag}を管理者として追加しました。`);
          await interaction.reply({ embeds: [successEmbed] });
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

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

// admin.jsonとblacklist.jsonのパス
const adminFilePath = path.join(__dirname, "../json/admin.json");
const blacklistFilePath = path.join(__dirname, "../json/blacklist.json");
const farmPath = path.join(__dirname, "../json/farm.json");
const userDataPath = path.join(__dirname, "../json/userData.json");
const configDataPath = path.join(__dirname, "../json/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("管理者専用のコマンドです")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("server")
        .setDescription("ボットが参加中のサーバーを表示します")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leave")
        .setDescription("指定されたサーバーからボットを退出させます")
        .addStringOption((option) =>
          option
            .setName("server_id")
            .setDescription("サーバーID")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("invite")
        .setDescription("指定されたサーバーの招待リンクを生成します")
        .addStringOption((option) =>
          option
            .setName("server_id")
            .setDescription("サーバーID")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("member")
        .setDescription("管理者を追加します")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("管理者として追加するユーザー")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("blacklist")
        .setDescription("ユーザーまたはサーバーをブラックリストに登録します")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("ブラックリストのタイプ (user または server)")
            .setRequired(true)
            .addChoices(
              { name: "ユーザー", value: "user" },
              { name: "サーバー", value: "server" }
            )
        )
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("ユーザーIDまたはサーバーID")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("reload")
        .setDescription("指定したコマンドをリロードします")
        .addStringOption((option) =>
          option
            .setName("command_name")
            .setDescription("リロードするコマンドの名前")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("db")
        .setDescription("ユーザーの情報を確認します")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("確認するユーザー")
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
            .setName('code')
            .setDescription('指定した名前のコードをファイルにして送信')
            .addStringOption(option =>
              option.setName('filename')
                .setDescription('出力するコードのファイル名')
                .setRequired(true)
         )
    )
    .addSubcommand((subcommand) =>
      subcommand
            .setName("money")
            .setDescription("ユーザーの所持金を操作します")
            .addUserOption((option) =>
              option
                .setName("user")
                .setDescription("対象のユーザー")
                .setRequired(true)
            )
           .addIntegerOption((option) =>
             option
               .setName("amount")
               .setDescription("増減させる金額（マイナスも可）")
               .setRequired(true)
           )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("status")
        .setDescription("botのステータスを設定します。")
        .addStringOption((option) =>
          option
            .setName("type")
            .setDescription("ステータスを選択してください。")
            .setRequired(true)
            .addChoices(
              { name: "通常", value: "safe" },
              { name: "開発中", value: "developing" },
              { name: "運用停止", value: "stop" }
            )
        )
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const member = interaction.member;

    try {
      const adminData = JSON.parse(fs.readFileSync(adminFilePath, "utf-8"));

      // 実行者が管理者かどうか確認
      if (!adminData.admins.includes(member.id)) {
        const errorEmbed = new EmbedBuilder()
          .setColor("Red")
          .setTitle("権限エラー")
          .setDescription("このコマンドはbot関係者のみ実行できます。(一般の方は使用できません)");
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        return;
      }

      if (subcommand === "server") {
        const guilds = interaction.client.guilds.cache.map(guild => `**${guild.name}** - \`${guild.id}\``).join("\n");
        const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("ボットが参加中のサーバー一覧")
        .setDescription(guilds || "サーバー情報が見つかりませんでした。");

      return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (subcommand === "leave") {
        const serverId = interaction.options.getString("server_id");
        const guild = interaction.client.guilds.cache.get(serverId);
        if (!guild) {
          const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("サーバーエラー")
            .setDescription("指定されたサーバーが見つかりません。");
          return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        await guild.leave();
        const successEmbed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("サーバーから退出しました")
          .setDescription(`${guild.name} からボットが退出しました。`);
        await interaction.reply({ embeds: [successEmbed] });
      }

      if (subcommand === "invite") {
        const serverId = interaction.options.getString("server_id");
      const guild = interaction.client.guilds.cache.get(serverId);

      if (!guild) {
        return await interaction.reply({ content: "指定されたサーバーが見つかりません。", ephemeral: true });
      }

      const textChannel = guild.channels.cache.find(
        channel => channel.isTextBased() && channel.permissionsFor(guild.members.me).has("CreateInstantInvite")
      );

      if (!textChannel) {
        return await interaction.reply({ content: "招待リンクを作成できるチャンネルが見つかりませんでした。", ephemeral: true });
      }

      const invite = await textChannel.createInvite({
        maxUses: 1,
        unique: true,
        maxAge: 0 // 無制限
      });

      return await interaction.reply({ content: `✅ 招待リンク：${invite.url}`, ephemeral: true });
      }

      if (subcommand === "member") {
        const user = interaction.options.getUser("user");
        const successEmbed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("管理者追加")
          .setDescription(`${user.tag} を管理者として追加しました。`);
        adminData.admins.push(user.id);
        fs.writeFileSync(adminFilePath, JSON.stringify(adminData, null, 2), "utf-8");
        await interaction.reply({ embeds: [successEmbed] });
      }

      if (subcommand === "blacklist") {
        const type = interaction.options.getString("type");
        const id = interaction.options.getString("id");
        const blacklist = JSON.parse(fs.readFileSync(blacklistFilePath, "utf-8"));

        if (type === "user") {
          if (!blacklist.bannedUsers) blacklist.bannedUsers = [];
          if (!blacklist.bannedUsers.includes(id)) {
            blacklist.bannedUsers.push(id);
          }
        } else if (type === "server") {
          if (!blacklist.bannedServers) blacklist.bannedServers = [];
          if (!blacklist.bannedServers.includes(id)) {
            blacklist.bannedServers.push(id);
          }
        }



        fs.writeFileSync(blacklistFilePath, JSON.stringify(blacklist, null, 2), "utf-8");

        const successEmbed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("ブラックリスト登録")
          .setDescription(`${type === "user" ? "ユーザー" : "サーバー"} ${id} をブラックリストに登録しました。`);
        await interaction.reply({ embeds: [successEmbed] });
      }

      if (subcommand === "reload") {
        const commandName = interaction.options.getString("command_name");
        const command = interaction.client.commands.get(commandName);
        if (!command) {
          const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("コマンドエラー")
            .setDescription("指定されたコマンドが見つかりません。");
          return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
        delete require.cache[require.resolve(`./${commandName}.js`)];
        interaction.client.commands.delete(commandName);
        const newCommand = require(`./${commandName}.js`);
        interaction.client.commands.set(newCommand.data.name, newCommand);
        const successEmbed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("コマンドリロード")
          .setDescription(`${commandName} をリロードしました。`);
        await interaction.reply({ embeds: [successEmbed] });
      }

      if (subcommand === "db") {
        const user = interaction.options.getUser("user");
        const userData = JSON.parse(fs.readFileSync(userDataPath, "utf-8"));
        if (!userData[user.id]) {
          const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("データエラー")
            .setDescription("指定されたユーザーのデータが見つかりません。");
          return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const userInfoEmbed = new EmbedBuilder()
          .setColor("Blue")
          .setTitle(`${user.tag} のデータ`)
          .setDescription(`G: ${userData[user.id].G}`);
        await interaction.reply({ embeds: [userInfoEmbed] });
      }

      if (subcommand === "code") {
        const filename = interaction.options.getString("filename");
        const codeFilePath = path.join(__dirname, `${filename}`);
        if (!fs.existsSync(codeFilePath)) {
          const errorEmbed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("ファイルエラー")
            .setDescription("指定されたコードファイルが見つかりません。");
          return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const codeFile = new AttachmentBuilder(codeFilePath);
        const successEmbed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("コードファイル")
          .setDescription(`${filename} のコードファイル`);
        await interaction.reply({ embeds: [successEmbed], files: [codeFile] });
      }
      
      if (subcommand === "money") {
        const targetUser = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        const userData = JSON.parse(fs.readFileSync(userDataPath, "utf-8"));
        const configData = JSON.parse(fs.readFileSync(configDataPath, "utf-8"));

        // データがない場合は初期化
　　    if (!userData[targetUser.id]) {
          userData[targetUser.id] = { G: 0, userjob: "無職", userName: `${targetUser.username}`};
       }

        // 金額加算・減算
        userData[targetUser.id].G += amount;
        configData.運営金庫 -= amount;
        configData.ユーザー保有数 += amount;

        // 負の値にしない（必要なら）
        if (userData[targetUser.id].G < 0) userData[targetUser.id].G = 0;

        fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2), "utf-8");
        fs.writeFileSync(configDataPath, JSON.stringify(configData, null, 2), "utf-8");

        const embed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("所持金の更新")
          .setDescription(
            `${targetUser.tag} の所持金を ${amount >= 0 ? `+${amount}` : amount} G 変更しました。\n現在の残高: ${userData[targetUser.id].G} G`
          );

         return interaction.reply({ embeds: [embed] });
      }
      
    if (subcommand === "status") {
    const type = interaction.options.getString("type");
    const id = interaction.options.getString("id"); // 未使用だが必要なら処理追加
    const configData = JSON.parse(fs.readFileSync(configDataPath, "utf-8"));

    if (!["safe", "developing", "stop"].includes(type)) {
      return interaction.reply({
        content: "無効なステータスです。`safe`, `developing`, `stop` のいずれかを指定してください。",
        ephemeral: true,
      });
    }

    configData.status = type;
    fs.writeFileSync(configDataPath, JSON.stringify(configData, null, 2), "utf-8");

    // Glitchの再起動を促すためにダミーファイルを変更
    const fakeChannelId = "000000000000000000";
　　const channel = await client.channels.fetch(fakeChannelId);
　　　channel.send("これは失敗します");

    const successEmbed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ ステータス変更完了")
      .setDescription(`ステータスを **${type}** に変更しました。`);

    await interaction.reply({ embeds: [successEmbed] });
      }
    } catch (error) {
      console.error(error);
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("エラー")
        .setDescription("コマンドの実行中にエラーが発生しました。");
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
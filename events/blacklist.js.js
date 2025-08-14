const fs = require("fs");
const path = require("path");
const blacklist = require("../json/blacklist.json"); // パスはプロジェクト構成に合わせて調整

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isCommand()) return;

    // ブラックリストチェック
    if (blacklist.bannedUsers.includes(interaction.user.id)) {
      await interaction.reply({
        content:
          "あなたはこのボットの使用を禁止されています。もしサポートが必要な場合サポートサーバーにお越しください。",
        ephemeral: true,
      });
      return;
    }

    if (blacklist.bannedServers.includes(interaction.guild?.id)) {
      await interaction.reply({
        content:
          "このサーバーはこのボットの使用を禁止されています。サーバーの管理者はもしサポートが必要な場合サポートサーバーにお越しください。",
        ephemeral: true,
      });
      return;
    }

    // メンテナンスモードの確認
    const configData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../json/config.json"), "utf-8")
    );
    const userId = interaction.user.id;
    if (configData.status === "stop" && !configData.devUsers.includes(userId)) {
      await interaction.reply({
        content: "🚧 現在すべてのコマンドが使用できません（メンテナンス中です）。",
        ephemeral: true,
      });
      return;
    }
  },
};

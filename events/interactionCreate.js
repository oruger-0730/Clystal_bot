const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    // ログデータ作成
    const user = interaction.user.tag;
    const userId = interaction.user.id;
    const commandName = interaction.commandName;
    const subcommand = interaction.options.getSubcommand(false);
    const guildName = interaction.guild?.name || "DM";

    const logEntry = {
      timestamp: new Date().toISOString(),
      user,
      userId,
      command: `/${commandName}${subcommand ? " " + subcommand : ""}`,
      guild: guildName
    };

    // ログファイルに書き込み
    const logFilePath = path.join(__dirname, '../json/log.json'); // ← 必要に応じて調整
    const logLine = JSON.stringify(logEntry) + "\n";

    try {
      fs.appendFileSync(logFilePath, logLine, 'utf8');
    } catch (e) {
      console.error("ログ書き込みエラー:", e);
    }

    // ---- コマンド統計記録（全体） ----
    const statsPath = path.join(__dirname, '../json/command_statistics.json');
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'

    let stats = {};
    if (fs.existsSync(statsPath)) {
      stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
    }

    stats[today] = (stats[today] || 0) + 1;

    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));

    // ---- コマンドを実行 ----
    const command = interaction.client.commands.get(commandName);
 
  }
};

const fs = require('fs');
const path = './json/message_statistics.json';

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const guildId = message.guild.id;

    let data = {};
    if (fs.existsSync(path)) {
      data = JSON.parse(fs.readFileSync(path, 'utf8'));
    }

    // 初期化
    if (!data[guildId]) data[guildId] = {};
    if (!data[guildId][today]) data[guildId][today] = 0;

    // カウント
    data[guildId][today]++;

    // 最大30日分だけ残す
    const guildEntries = Object.entries(data[guildId])
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-30);

    data[guildId] = Object.fromEntries(guildEntries);

    // 保存
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  }
};

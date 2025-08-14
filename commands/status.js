const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const os = require("os");
const fs = require("fs");
const path = require("path");

const configDataPath = path.join(__dirname, "../json/config.json");

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("Botとサーバーのステータスを表示します"),

  async execute(interaction) {
    const client = interaction.client;

    // Ping（応答速度）
    const ping = client.ws.ping;

    // 登録済みコマンド数
    const commandCount = client.commands?.size || 0;

    // メモリ使用率
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);
    
    const cpus = os.cpus();
    const cpuModel = cpus[0].model;
    const cpuSpeed = cpus[0].speed;

    // CPU使用率計測（1秒間隔）
    const start = getCPUInfo();
    await new Promise(resolve => setTimeout(resolve, 1000));
    const end = getCPUInfo();
    const idleDiff = end.idle - start.idle;
    const totalDiff = end.total - start.total;
    const cpuUsagePercent = (100 - (idleDiff / totalDiff) * 100).toFixed(2);

    // 稼働時間
    const serverUptime = formatUptime(os.uptime());
    const botUptime = formatUptime(process.uptime());

    // サーバーとユーザー数
    const guildCount = client.guilds.cache.size;
    const totalUsers = client.guilds.cache.reduce(
      (acc, guild) => acc + (guild.memberCount || 0),
      0
    );
    const configData = readJSON(configDataPath);
    const moderateMoney = configData.運営金庫;
    const totalUserMoney = configData.ユーザー保有数;
    const totalMoney = moderateMoney + totalUserMoney;
    const percentage = (moderateMoney/totalMoney) *100;
    const status = configData.status;

    const embed = new EmbedBuilder()
      .setTitle("📊 Bot ステータス")
      .setColor("Blue")
      .addFields(
        { name: "💾 メモリ使用率", value: `${memUsagePercent}%`, inline: true },
        { name: "🖥️ CPU使用率", value: `${cpuUsagePercent}%`, inline: true },
        { name: "🧩 CPUモデル", value: `${cpuModel} @${cpuSpeed}MHz`, inline: false },
        { name: "📶 応答速度", value: `${ping}ms`, inline: true },
        { name: "⏱️ サーバー稼働時間", value: serverUptime, inline: true },
        { name: "🤖 Bot稼働時間", value: botUptime, inline: true },
        { name: "🛠️ Botステータス", value: `${status}`, inline: true },
        { name: "📌 登録コマンド数", value: `${commandCount} 個`, inline: true },
        { name: "🌐 サーバー数", value: `${guildCount} 個`, inline: true },
        { name: "👥 合計ユーザー数", value: `${totalUsers} 人`, inline: true },
        { name: "🗝️ 運営金庫", value:`${moderateMoney} G`, inline: true },
        { name: "💰　合計ユーザー保有数", value:`${totalUserMoney} G`, inline: true },
        { name: "📈　運営金庫保有率", value:`${percentage} %`, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed]});
  }
};

// CPU情報取得
function getCPUInfo() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }

  return { idle, total };
}

// 秒 → 人間が読める時間に変換
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  seconds %= 3600 * 24;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);

  return `${days}日 ${hours}時間 ${minutes}分 ${seconds}秒`;
}
const { Client, GatewayIntentBits, Collection, Events } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { clientId, token } = require("./json/config.json");
const fs = require("fs");
const path = require("path");
const configDataPath = './json/config.json';
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
// コマンドファイルの読み込み
client.commands = new Collection();

// コマンド登録
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`⚠️ ${file} は data または execute が不足しています`);
  }
}

// イベント読み込み処理（これが重要！）
const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
    console.log(`Loaded ${event.name}`);
  } else {
    client.on(event.name, (...args) => event.execute(...args));
    console.log(`Loaded ${event.name}`);
  }
}

const userDataPath = './json/userData.json';
let userData = JSON.parse(fs.readFileSync(userDataPath, 'utf-8'));
function enforceGLimit() {
  let changed = false;

  for (const userId in userData) {
    if (userData[userId].G > 10000000) {
      userData[userId].G = 10000000;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(userDataPath, JSON.stringify(userData, null, 2));
    console.log("[自動修正] Gが1000万超えてるユーザーを修正しました。");
  }
}

// 5分ごとに実行
setInterval(enforceGLimit, 5 * 60 * 1000);

// Bot起動時にも一応一回チェックしておく
enforceGLimit();


client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return; // コマンド以外は無視
  // 通常コマンドの取得
  const command = client.commands.get(interaction.commandName);
  // コマンド実行
  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(
      `エラー: コマンド「${interaction.commandName}」の実行中に問題が発生しました, error`
    );
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content:
          "コマンドの実行中にエラーが発生しました。もう一度お試しください。",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          "コマンドの実行中にエラーが発生しました。もう一度お試しください。",
        ephemeral: true,
      });
    }
  }
});

// ボットを Discord にログイン
client.login(token);
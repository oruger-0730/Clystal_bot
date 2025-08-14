const { ActivityType } = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { clientId, token } = require("../json/config.json");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    console.log("ボットが準備完了しました！");

    const configDataPath = path.join(__dirname, "../json/config.json");
    let configData = JSON.parse(fs.readFileSync(configDataPath, "utf-8"));

    // ステータス設定
    if (configData.status === "developing") {
      client.user.setStatus("idle");
      client.user.setActivity("開発中（一部機能停止中）", {
        type: ActivityType.Watching,
      });
    } else if (configData.status === "stop") {
      client.user.setStatus("dnd");
      client.user.setActivity("重大インシデント発生中", {
        type: ActivityType.Listening,
      });
    } else {
      client.user.setStatus("online");
      let stats = 0;
      setInterval(async () => {
        if (stats === 0) {
          client.user.setActivity(`/help | ping: ${client.ws.ping}ms`, {
            type: ActivityType.Playing,
          });
          stats = 1;
        } else {
          const serverCount = client.guilds.cache.size;
          const totalMembers = client.guilds.cache.reduce(
            (count, guild) => count + guild.memberCount,
            0
          );
          client.user.setActivity(
            `${serverCount} servers | ${totalMembers} users`,
            { type: ActivityType.Playing }
          );
          stats = 0;
        }
      }, 5000);
    }

    // グローバルコマンドの登録
    const rest = new REST({ version: "10" }).setToken(token);
    try {
      console.log("グローバルコマンドを再登録中...");
      const commands = client.commands.map((command) => command.data.toJSON());
      const commandsName = client.commands.map((command) => command.data.name);
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log("グローバルコマンドの再登録が完了しました！");
      console.log(`Loaded ${commandsName}`);
    } catch (error) {
      console.error(
        "エラー: グローバルコマンド再登録中に問題が発生しました",
        error
      );
    }
    const savePing = () => {
      const pingDataPath = path.join(__dirname, "../json/ping_history.json");
      const now = new Date();
      const ping = client.ws.ping;

      // JST時間に変換して文字列化
      const jstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const timeString = jstTime.toISOString().replace('T', ' ').substring(0, 19); // 例: 2025-05-21 18:00:00

      let data = [];
      if (fs.existsSync(pingDataPath)) {
        try {
          data = JSON.parse(fs.readFileSync(pingDataPath, 'utf8'));
        } catch (e) {
          console.error('ping_history.json 読み込みエラー:', e);
        }
      }

      // 24時間以内のデータに絞る（timestampで判定）
      const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
      data = data.filter(entry => entry.timestamp >= oneDayAgo);

      // 現在のpingを追加
      data.push({ time: timeString, ping, timestamp: now.getTime() });
      
      while (data.length > 24) {
        data.shift();
      }

      // 保存
      fs.writeFileSync(pingDataPath, JSON.stringify(data, null, 2));
    };

    // ✅ 起動時の保存なし
    // ❌ savePing();

    // ⏰ 1時間ごとに保存
    setInterval(savePing, 1000 *60 *5 );
  },
};

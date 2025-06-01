const fs = require("fs");
const path = "./json/spamblock.json";

const loadspamblockSettings = () => {
  try {
    if (!fs.existsSync(path)) {
      return { servers: {} };
    }
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (error) {
    console.error("設定の読み込みに失敗しました:", error);
    return { servers: {} };
  }
};

const userMessages = new Map();

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const spamSettings = loadspamblockSettings();

    if (!spamSettings.servers.includes(guildId)) return;

    const userId = message.author.id;
    const now = Date.now();

    if (!userMessages.has(userId)) {
      userMessages.set(userId, []);
    }

    const timestamps = userMessages.get(userId);
    timestamps.push(now);

    const filtered = timestamps.filter((timestamp) => now - timestamp <= 5000);
    userMessages.set(userId, filtered);

    if (filtered.length >= 7) {
      try {
        const targetMember = await message.guild.members.fetch(userId);

        await targetMember.timeout(
          10 * 60 * 1000,
          "5秒以内に7回以上メッセージ送信"
        );

        const messages = await message.channel.messages.fetch({ limit: 100 });
        const userMessagesToDelete = messages.filter(
          (msg) =>
            msg.author.id === userId &&
            Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
        );

        if (userMessagesToDelete.size > 0) {
          await message.channel.bulkDelete(userMessagesToDelete, true);
          console.log(`Deleted ${userMessagesToDelete.size} messages from ${userId}`);
        }

        await message.channel.send({
          content: `<@${targetMember.id}> がスパム行為でタイムアウトされました。最近のメッセージを削除しました。`,
        });
      } catch (error) {
        console.error("エラーが発生しました:", error);
      }

      userMessages.delete(userId);
    }
  },
};

const { PermissionsBitField } = require("discord.js");
const fs = require("fs");

// 設定ファイルを読み込む関数
const loadSettings = async () => {
  try {
    const data = fs.readFileSync("./json/joinMessages.json", "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("設定の読み込みに失敗しました:", err);
    return {};
  }
};

module.exports = {
  name: "guildMemberAdd",
  async execute(member, client) {
    try {
      const settings = await loadSettings();
      const guildId = member.guild.id;

      const channelId = Object.keys(settings).find((id) => {
        const channel = member.guild.channels.cache.get(id);
        return channel && settings[id].message;
      });

      if (!channelId) return;

      const message = settings[channelId].message.replace(
        "[user]",
        `<@${member.id}>`
      );

      const channel = await member.guild.channels.fetch(channelId).catch(() => null);
      if (!channel || !channel.isTextBased()) return;

      if (
        !channel
          .permissionsFor(member.guild.members.me)
          .has([
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ViewChannel,
          ])
      ) {
        console.error(`チャンネル ${channel.id} でメッセージを送信する権限がありません。`);
        return;
      }

      await channel.send(message);
    } catch (error) {
      console.error("guildMemberAdd イベントの処理中にエラーが発生しました:", error);
    }
  },
};

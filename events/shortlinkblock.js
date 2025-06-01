const fs = require("fs");

const shortLinkDomains = [
  "bit.ly", "tinyurl.com", "t.co", "is.gd", "goo.gl", "ow.ly", "buff.ly", "adf.ly", "shorte.st", "cutt.ly", "i8.ae"
];

const allowedDomains = [
  "chatgpt.com",
  "bot.com"
];

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const shortlinkData = JSON.parse(fs.readFileSync("./json/shortlinkblock.json", "utf-8"));
    const shortlinkEnabledGuilds = shortlinkData.servers;
    if (!shortlinkEnabledGuilds.includes(guildId)) return;

    // メッセージ内のhttp(s)リンクのみを対象
    const urls = message.content.match(/https?:\/\/[^\s]+/gi);
    if (!urls) return;

    // 許可ドメインのパターン
    const allowedPattern = new RegExp(
      allowedDomains.map(domain => `https?:\\/\\/(?:www\\.)?${domain.replace('.', '\\.')}`).join("|"),
      "i"
    );

    // 許可されている場合は何もしない
    if (urls.some(url => allowedPattern.test(url))) return;

    // ショートリンクに一致するかを確認
    const foundDomain = shortLinkDomains.find(domain => {
      const pattern = new RegExp(`https?:\\/\\/(?:www\\.)?${domain.replace('.', '\\.')}`, "i");
      return urls.some(url => pattern.test(url));
    });

    if (foundDomain) {
      try {
        await message.delete();
        await message.channel.send(
          `<@${message.author.id}> ショートリンクは禁止されています！ドメイン: **${foundDomain}**`
        );
      } catch (error) {
        console.error("メッセージの削除に失敗しました:", error);
      }
    }
  }
};

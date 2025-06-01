// events/guildMemberRemove.js

const fs = require("fs");
const path = "./json/leavemessage.json";

module.exports = {
  name: "guildMemberRemove",
  async execute(member) {
    if (!fs.existsSync(path)) return;

    const config = JSON.parse(fs.readFileSync(path, "utf8"));
    const guildConfig = config[member.guild.id];
    if (!guildConfig) return;

    const channel = member.guild.channels.cache.get(guildConfig.channelId);
    if (!channel) return;

    const message = guildConfig.message.replace(/\[user\]/g, `<@${member.id}>`);
    channel.send(message).catch(console.error);
  },
};

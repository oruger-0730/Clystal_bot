const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment-timezone');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('time')
    .setDescription('世界中の標準時刻を表示します（25カ国）'),

  async execute(interaction) {
    const timezones = [
      { name: "日本 (Tokyo)", zone: "Asia/Tokyo" },
      { name: "アメリカ (ニューヨーク)", zone: "America/New_York" },
      { name: "アメリカ (ロサンゼルス)", zone: "America/Los_Angeles" },
      { name: "イギリス (ロンドン)", zone: "Europe/London" },
      { name: "フランス (パリ)", zone: "Europe/Paris" },
      { name: "ドイツ (ベルリン)", zone: "Europe/Berlin" },
      { name: "ロシア (モスクワ)", zone: "Europe/Moscow" },
      { name: "中国 (北京)", zone: "Asia/Shanghai" },
      { name: "インド (デリー)", zone: "Asia/Kolkata" },
      { name: "ブラジル (ブラジリア)", zone: "America/Sao_Paulo" },
      { name: "カナダ (トロント)", zone: "America/Toronto" },
      { name: "オーストラリア (シドニー)", zone: "Australia/Sydney" },
      { name: "韓国 (ソウル)", zone: "Asia/Seoul" },
      { name: "メキシコ (メキシコシティ)", zone: "America/Mexico_City" },
      { name: "南アフリカ (ヨハネスブルグ)", zone: "Africa/Johannesburg" },
      { name: "イタリア (ローマ)", zone: "Europe/Rome" },
      { name: "スペイン (マドリード)", zone: "Europe/Madrid" },
      { name: "トルコ (イスタンブール)", zone: "Europe/Istanbul" },
      { name: "サウジアラビア (リヤド)", zone: "Asia/Riyadh" },
      { name: "アラブ首長国連邦 (ドバイ)", zone: "Asia/Dubai" },
      { name: "ニュージーランド (オークランド)", zone: "Pacific/Auckland" },
      { name: "アルゼンチン (ブエノスアイレス)", zone: "America/Argentina/Buenos_Aires" },
      { name: "エジプト (カイロ)", zone: "Africa/Cairo" },
      { name: "タイ (バンコク)", zone: "Asia/Bangkok" },
      { name: "インドネシア (ジャカルタ)", zone: "Asia/Jakarta" },
    ];

    const embed = new EmbedBuilder()
      .setTitle('世界の標準時刻（25カ国）')
      .setColor(0x1abc9c)
      .setTimestamp();

    for (const tz of timezones) {
      const time = moment().tz(tz.zone).format('YYYY-MM-DD HH:mm:ss');
      embed.addFields({ name: tz.name, value: time, inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  },
};

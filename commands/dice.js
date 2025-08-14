const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const userDataPath = path.join(__dirname, '../json/userData.json');
const farmDataPath = path.join(__dirname, '../json/farm.json');
const configDataPath = path.join(__dirname, '../json/config.json');

// 共通読み書き関数
function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('ディーラーとサイコロ2つで勝負！勝てばGが2倍！')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('賭けるGの額（自然数）')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const bet = interaction.options.getInteger('bet');
    const targetUser = interaction.user;
    const targetUserId = targetUser.id;

    // 各種データ読み込み
    const configData = readJSON(configDataPath);
    let userData = readJSON(userDataPath);
    let farmData = readJSON(farmDataPath);

    // 開発モード制限
    if (configData.status === "developing" && !configData.devUsers.includes(userId)) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("開発中")
        .setDescription("現在bot開発のため一部機能を制限しています。後ほどお試しください。");
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    // ユーザーデータ初期化
    if (!userData[userId]) {
      userData[userId] = {
        G: 0,
        riceSeeds: 0,
        carrotSeeds: 0,
        cornSeeds: 0,
        rice: 0,
        carrot: 0,
        corn: 0,
        lastWorkTime: 0,
        userName: targetUser.username
      };
    }

    // 農場データ初期化
    if (!farmData[targetUserId]) {
      farmData[targetUserId] = {
        farmLevel: 1,
        plantedSeeds: 0,
        nextHarvestTime: 0,
        plantedKind: "米",
        lastRicePriceChange: 0
      };
    }
    
    writeJSON(userDataPath, userData);
    writeJSON(farmDataPath, farmData);

    // 残高確認
    if (userData[userId].G < bet) {
      return interaction.reply({
        content: `所持金が足りません。現在のG: ${userData[userId].G}`,
        ephemeral: true
      });
    }

    // サイコロロール
    const userRoll = Math.floor(Math.random() * 11) + 2;
    const dealerRoll = Math.floor(Math.random() * 9) + 4;

    let result = '';
    let color = '';

    if (userRoll > dealerRoll) {
      userData[userId].G += bet;
      result = `🎉 勝ちました！${bet * 2}Gを獲得！（+${bet}G）`;
      color = 'Green';
    } else if (userRoll === dealerRoll) {
      result = `🤝 引き分けでした。Gは失いません。`;
      color = 'Yellow';
    } else {
      userData[userId].G -= bet;
      result = `💥 負けました... ${bet}Gを失いました。`;
      color = 'Red';
    }

    // データ保存
    writeJSON(userDataPath, userData);
    writeJSON(farmDataPath, farmData);

    // 結果送信
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('🎲 サイコロ勝負！')
      .setDescription(`あなたの出目: **${userRoll}**\nディーラーの出目: **${dealerRoll}**\n\n${result}`)
      .setFooter({ text: `現在の所持金: ${userData[userId].G}G` });

    return interaction.reply({ embeds: [embed] });
  }
};

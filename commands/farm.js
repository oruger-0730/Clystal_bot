const { SlashCommandBuilder, EmbedBuilder, InteractionType } = require('discord.js');
const fs = require('fs');
const path = require('path');

// データファイルのパス
const userDataPath = path.join(__dirname, '../json/userData.json');
const farmDataPath = path.join(__dirname, '../json/farm.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('farm')
    .setDescription('農場関連のコマンドです。')
    .addSubcommand(subcommand =>
      subcommand
        .setName('work')
        .setDescription('仕事をして米の種を得ます！')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('plant')
        .setDescription('種を植えて米を育てます！')
        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('植える種の数を指定します。')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('harvest')
        .setDescription('育った米を収穫します！')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('item')
        .setDescription('指定した人の持ち物を表示します。')
        .addUserOption(option =>
          option
            .setName('target')
            .setDescription('持ち物を確認したいユーザーを指定します。')
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('sell')
        .setDescription('収穫した米を売ります！')
        .addIntegerOption(option =>
          option
            .setName('amount')
            .setDescription('売る米の数を指定します。')
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'work') {
      await this.work(interaction);
    } else if (subcommand === 'plant') {
      await this.plant(interaction);
    } else if (subcommand === 'harvest') {
      await this.harvest(interaction);
    } else if (subcommand === 'item') {
      await this.item(interaction);
    } else if (subcommand === 'sell') {
      await this.sell(interaction);
    }
  },

  async sell(interaction) {
    const userId = interaction.user.id;
    const amount = interaction.options.getInteger('amount');

    // データの読み込み
    let userData = this.readJSON(userDataPath);
    let farmData = this.readJSON(farmDataPath);

    // ユーザー初期化
    if (!userData[userId]) {
      userData[userId] = { riceSeeds: 0, lastWorkTime: 0, rice: 0, G:0 };
    }

    if (!farmData[userId]) {
      farmData[userId] = { farmLevel: 1, plantedSeeds: 0, nextHarvestTime: 0 };
    }

    const user = userData[userId];

    // 売れる米があるかチェック
    if (user.rice <= 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('エラー')
            .setDescription('米がありません！まずは /farm harvest で収穫してください。')
        ],
      });
    }

    if (amount > user.rice) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('エラー')
            .setDescription(`売れる米の数 (${user.rice}個) を超える数を売ることはできません。`)
        ],
      });
    }

    // 米の価格設定 (750〜1000でランダムに変動)
    const lastPriceChange = farmData[userId].lastPriceChange || 0;
    const currentTime = Date.now();
    let ricePrice = 750;

    if (currentTime - lastPriceChange > 15 * 60 * 1000) {  // 15分経過
      const priceChance = Math.random();
      if (priceChance < 0.5) {
        ricePrice = 750;
      } else {
        ricePrice = Math.floor(Math.random() * (1000 - 751) + 751);
      }

      // 価格の更新
      farmData[userId].lastPriceChange = currentTime;
      this.writeJSON(farmDataPath, farmData);
    }

    // 米を売る
    const Gamount = ricePrice * amount;
    user.rice -= amount;  // 売った米の分を減らす
    user.G += ricePrice * amount;

    // データ保存
    this.writeJSON(userDataPath, userData);

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setTitle('米を売りました！')
          .setDescription(`${amount}個の米を売って、${Gamount}Gを得ました！\n現在の米の数: ${user.rice}個\n合計G: ${user.G}G`)
      ],
    });
  },

  async item(interaction) {
    const targetUser = interaction.options.getUser('target') || interaction.user;
    const targetUserId = targetUser.id;

    // データの読み込み
    let userData = this.readJSON(userDataPath);

    // ユーザー初期化
    if (!userData[targetUserId]) {
      userData[targetUserId] = { riceSeeds: 0, lastWorkTime: 0, rice: 0, G:0 };
    }

    const user = userData[targetUserId];

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Blue')
          .setTitle(`${targetUser.username}さんの持ち物`)
          .setDescription(
            `🌱 米の種: ${user.riceSeeds}個\n🍚 米: ${user.rice}個\n💵 G: ${user.G}`
          )
      ],
    });
  },

  async harvest(interaction) {
    const userId = interaction.user.id;

    // データの読み込み
    let userData = this.readJSON(userDataPath);
    let farmData = this.readJSON(farmDataPath);

    // ユーザー初期化
    if (!userData[userId]) {
      userData[userId] = { riceSeeds: 0, lastWorkTime: 0, rice: 0, G:0 };
    }

    if (!farmData[userId]) {
      farmData[userId] = { farmLevel: 1, plantedSeeds: 0, nextHarvestTime: 0 };
    }

    const farm = farmData[userId];

    // 収穫可能かチェック
    if (farm.plantedSeeds === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('収穫できるものがありません')
            .setDescription('まずは `/farm plant` で種を植えてください。')
        ],
      });
    }

    if (Date.now() < farm.nextHarvestTime) {
      const timeRemaining = farm.nextHarvestTime - Date.now();
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('まだ収穫できません')
            .setDescription(`収穫可能になるまであと ${minutes}分 ${seconds}秒お待ちください。`)
        ],
      });
    }

    // 米の収穫
    const harvestedRice = farm.plantedSeeds;
    userData[userId].rice = (userData[userId].rice || 0) + harvestedRice;
    farm.plantedSeeds = 0;
    farm.nextHarvestTime = 0;

    // データ保存
    this.writeJSON(userDataPath, userData);
    this.writeJSON(farmDataPath, farmData);

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setTitle('収穫完了！')
          .setDescription(`農場から ${harvestedRice}個の米を収穫しました！\n現在の持ち米: ${userData[userId].rice}個`)
      ],
    });
  },

  async plant(interaction) {
    const userId = interaction.user.id;
    const amount = interaction.options.getInteger('amount');

    // データの読み込み
    let userData = this.readJSON(userDataPath);
    let farmData = this.readJSON(farmDataPath);

    // ユーザー初期化
    if (!userData[userId]) {
      userData[userId] = { riceSeeds: 0, lastWorkTime: 0, rice: 0, G:0 };
    }

    if (!farmData[userId]) {
      farmData[userId] = { farmLevel: 1, plantedSeeds: 0, nextHarvestTime: 0};
    }

    const user = userData[userId];
    const farm = farmData[userId];
    const maxSeeds = farm.farmLevel * 10; // レベルごとの最大種植え数

    // 植える条件をチェック
    if (user.riceSeeds <= 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('エラー')
            .setDescription('種がありません！まずは `/farm work` で種を集めてください。')
        ],
      });
    }

    if (amount > user.riceSeeds) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('エラー')
            .setDescription(`持っている種の数 (${user.riceSeeds}個) を超える数を植えることはできません。`)
        ],
      });
    }

    if (farm.plantedSeeds >= maxSeeds) {
      const timeRemaining = farm.nextHarvestTime - Date.now();
      const timerminutes = Math.floor(timeRemaining / 60000);
      const timerseconds = Math.floor((timeRemaining % 60000) / 1000);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('エラー')
            .setDescription(
              `すでに最大数の種 (${maxSeeds}個) が植えられています。\n ${farm.plantedSeeds}個収穫可能になるまであと ${timerminutes}分 ${timerseconds}秒お待ちください。`
            )
        ],
      });
    }
    if(Date.now()<farm.nextHarvestTime) {
      const timeRemaining = farm.nextHarvestTime - Date.now();
      const timerminutes = Math.floor(timeRemaining / 60000);
      const timerseconds = Math.floor((timeRemaining % 60000) / 1000);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('エラー')
            .setDescription(
              `すでに ${farm.plantedSeeds}個植えられてます。\n 収穫可能になるまであと ${timerminutes}分 ${timerseconds}秒お待ちください。`
            )
        ],
      });
    }
    if(farm.plantedSeeds === 0) {
      const seedsToPlant = Math.min(amount, maxSeeds - farm.plantedSeeds);
      user.riceSeeds -= seedsToPlant;
      farm.plantedSeeds += seedsToPlant;
      farm.nextHarvestTime = Date.now() + 30 * 60 * 1000; // 30分後

      // データ保存
      this.writeJSON(userDataPath, userData);
      this.writeJSON(farmDataPath, farmData);

      interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Green')
            .setTitle('種を植えました！')
            .setDescription(
              `${seedsToPlant}個の種を植えました！\n収穫可能になるまで30分お待ちください。\n現在の農場の状況: ${farm.plantedSeeds}/${maxSeeds}個`
            )
        ],
      });
    }
  },

  async work(interaction) {
    const userId = interaction.user.id;

    // データの読み込み
    let userData = this.readJSON(userDataPath);

    // ユーザー初期化
    if (!userData[userId]) {
      userData[userId] = { riceSeeds: 0, lastWorkTime: 0, rice: 0, G:0 };
    }

    const coolDownTime = 600000; // 10分 (ミリ秒)
    const currentTime = Date.now();
    const lastWorkTime = userData[userId].lastWorkTime;

    if (currentTime - lastWorkTime < coolDownTime) {
      const timeRemaining = coolDownTime - (currentTime - lastWorkTime);
      const minutes = Math.floor(timeRemaining / 60000);
      const seconds = Math.floor((timeRemaining % 60000) / 1000);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('クールタイム中')
            .setDescription(`次にワークができるまであと ${minutes}分 ${seconds}秒です。`),
        ],
      });
    }

    // 種を獲得
    const riceSeedsEarned = Math.floor(Math.random() * 5) + 5;
    userData[userId].lastWorkTime = currentTime;
    userData[userId].riceSeeds += riceSeedsEarned;

    this.writeJSON(userDataPath, userData);

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor('Green')
          .setTitle('お疲れ様でした！')
          .setDescription(`仕事をして、${riceSeedsEarned}個の米の種を得ました！\n現在の米の種の数は${userData[userId].riceSeeds}個です。`),
      ],
    });
  },

// JSON読み込み
readJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({}, null, 2), 'utf-8');
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error('JSON ファイルの読み込みエラー:', error);
    return {};
  }
},

// JSON書き込み
writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('JSON ファイルの保存エラー:', error);
  }
},
};
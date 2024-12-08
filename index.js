const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { clientId, token } = require('./json/config.json');
const fs = require('fs');

// Discord.js クライアント作成
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// コマンドファイルの読み込み
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ブラックリストの読み込み
const blacklistPath = './json/blacklist.json';
let blacklist = JSON.parse(fs.readFileSync(blacklistPath, 'utf-8'));

// ボットが準備完了したときの処理
client.once('ready', async () => {
  console.log('ボットが準備完了しました！');

  client.user.setStatus('online');

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
      client.user.setActivity(`${serverCount} servers | ${totalMembers} users`, {
        type: ActivityType.Playing,
      });
      stats = 0;
    }
  }, 5000);

  // コマンドの登録処理
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('開始: グローバルコマンドを登録中...');

    const commands = client.commands.map(command => command.data.toJSON());
    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log('成功: グローバルコマンドが登録されました');
  } catch (error) {
    console.error('エラー: コマンド登録中に問題が発生しました', error);
  }
});

const reportCommand = require('./commands/report.js');
reportCommand.client = client;

// コマンド実行時の処理
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  // ブラックリストチェック
  if (blacklist.users.includes(interaction.user.id)) {
    await interaction.reply({
      content: 'あなたはこのボットの使用を禁止されています。もしサポートが必要な場合サポートサーバーにお越しください。',
      ephemeral: true,
    });
    return; // ここで処理を終了
  }

  if (blacklist.servers.includes(interaction.guildId)) {
    await interaction.reply({
      content: 'このサーバーはこのボットの使用を禁止されています。サーバーの管理者はもしサポートが必要な場合サポートサーバーにお越しください。',
      ephemeral: true,
    });
    return; // ここで処理を終了
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    return interaction.reply({ content: '不明なコマンドです。', ephemeral: true });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`エラー: コマンド「${interaction.commandName}」の実行中に問題が発生しました`, error);
    await interaction.reply({
      content: 'コマンドの実行中にエラーが発生しました。もう一度お試しください。',
      ephemeral: true,
    });
  }
});

// ボットを Discord にログイン
client.login(token);


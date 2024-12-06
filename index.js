const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, token, guildId } = require('./config.json');  // guildId を使わないため config.json から取り出さなくても良い
const fs = require('fs');

// discord.jsのクライアントインスタンスを作成
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// RESTクライアントのインスタンスを作成
const rest = new REST({ version: '10' }).setToken(token);

// コマンドを格納するためのコレクションを作成
client.commands = new Collection();

// コマンドファイルを動的に読み込む
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

(async () => {
  try {
    console.log('開始: コマンドを登録中');

    // ボットが参加している全サーバーにコマンドを登録
    const guilds = client.guilds.cache;

    // 全サーバーに対してコマンド登録
    for (const [guildId] of guilds) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandFiles.map(file => require(`./commands/${file}`).data),
      });
      console.log(`サーバー ${guildId} にコマンドが登録されました`);
    }

    console.log('成功: コマンドが全サーバーに登録されました');
  } catch (error) {
    console.error('エラー: コマンド登録中に問題が発生しました', error);
  }
})();

// ボットが準備できたらメッセージを送信
client.once('ready', () => {
  console.log('ボットが準備完了しました!');
});

// コマンドの実行処理
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  // コマンドを実行
  if (client.commands.has(commandName)) {
    const command = client.commands.get(commandName);
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('エラー: コマンド実行中に問題が発生しました', error);
      await interaction.reply('コマンドの実行中にエラーが発生しました');
    }
  }
});

// ボットをログインさせる
client.login(token);

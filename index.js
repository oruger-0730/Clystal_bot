const { Client, GatewayIntentBits, Collection,ActivityType } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10'); // API バージョンを v10 に変更
const { clientId, token } = require('./config.json');
const fs = require('fs');

// Discord.js クライアントを作成
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// コマンドを格納するコレクションを作成
client.commands = new Collection();

// コマンドファイルを動的に読み込み
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ボットの準備が完了したら実行
client.once('ready', async () => {
  console.log('ボットが準備完了しました!');

  client.user.setStatus("online");

  let stats = 0;
  setInterval(async()=>{
    if(stats === 0){
      client.user.setActivity(`/help | ping:${client.ws.ping}ms`,{
        type: ActivityType.Playing
      });

      stats = 1;
    }else if(stats === 1){
      const updateActivity = () => {
      const serverCount = client.guilds.cache.size;
      let totalMembers = 0;

    client.guilds.cache.forEach(guild => {
      totalMembers += guild.memberCount;
    });
      client.user.setActivity(`${serverCount} server | ${totalMembers} user`,{
        type: ActivityType.Playing
      });
      };
      updateActivity();

      // 10分ごとに更新
      setInterval(updateActivity, 10 * 60 * 1000);
      stats = 0;
    }
  },5000);

  // REST クライアントの初期化
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('開始: グローバルコマンドを登録中...');

    // コマンドデータを取得
    const commands = client.commands.map(command => command.data.toJSON());

    // グローバルコマンドを登録
    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log('成功: グローバルコマンドが登録されました');
  } catch (error) {
    console.error('エラー: コマンド登録中に問題が発生しました', error);
  }
});

// コマンドの実行処理
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    return interaction.reply({ content: '不明なコマンドです。', ephemeral: true });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('エラー: コマンド実行中に問題が発生しました', error);
    await interaction.reply({
      content: 'コマンドの実行中にエラーが発生しました。もう一度お試しください。',
      ephemeral: true,
    });
  }
});

// ボットを Discord にログイン
client.login(token);

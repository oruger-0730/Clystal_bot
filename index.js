// 必要なモジュールをインポート
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const config = require('./config.json'); // config.jsonを読み込む

// クライアントを作成
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// コマンドを格納するコレクションを作成
client.commands = new Collection();

// コマンドデータを収集
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON()); // スラッシュコマンドデータを収集
}

// ボット起動時の処理
client.once('ready', async () => {
    console.log(`[システム] ボットが起動しました: ${client.user.tag}`);

    // スラッシュコマンドをグローバル登録
    const rest = new REST({ version: '10' }).setToken(config.token);
    try {
        console.log('[システム] スラッシュコマンドを全サーバーに登録中...');

        // グローバルコマンドを登録
        await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands }
        );

        console.log('[システム] スラッシュコマンドのグローバル登録が完了しました！');
    } catch (error) {
        console.error('[エラー] スラッシュコマンド登録中にエラーが発生しました:', error);
    }
});

// スラッシュコマンドの処理
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`[エラー] コマンドが見つかりません: ${interaction.commandName}`);
        return;
    }

    try {
        await command.execute(interaction);
        console.log(`[ログ] コマンド実行: ${interaction.commandName}`);
    } catch (error) {
        console.error(`[エラー] コマンド実行中にエラーが発生しました:`, error);
        await interaction.reply({
            content: 'コマンド実行中にエラーが発生しました。',
            ephemeral: true,
        });
    }
});

// トークンでボットにログイン
client.login(config.token).then(() => {
    console.log('[システム] ボットがログインしました');
}).catch(err => {
    console.error('[エラー] ボットのログインに失敗しました:', err);
});

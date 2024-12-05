const { REST, Routes } = require('discord.js');
const fs = require('fs');
const config = require('./config.json'); // config.jsonを読み込む

// コマンドデータを収集
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

// RESTクライアントを作成
const rest = new REST({ version: '10' }).setToken(config.token);

// コマンドを登録
(async () => {
    try {
        console.log('[システム] コマンドを登録中...');

        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );

        console.log('[システム] コマンドの登録が完了しました！');
    } catch (error) {
        console.error('[エラー] コマンド登録中にエラーが発生しました:', error);
    }
})();

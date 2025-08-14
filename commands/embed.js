const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js'); // Colors をインポート

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('埋め込みメッセージを作成します')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('埋め込みメッセージのタイトル')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('埋め込みメッセージの内容')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('color')
                .setDescription('埋め込みメッセージの色（例: RED, Blue, Green または #FF0000）')
                .setRequired(false)
        ),
    async execute(interaction) {
        try {
            // ユーザーからの入力を取得
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            const colorInput = interaction.options.getString('color') || 'BLUE'; // デフォルトは BLUE

            // 色を処理
            let embedColor;
            if (/^#[0-9A-Fa-f]{6}$/.test(colorInput)) {
                // 16進数カラーコードの場合
                embedColor = colorInput;
            } else {
                // Colors 定数に含まれるキーを柔軟に比較
                const colorKey = Object.keys(Colors).find(key => key.toLowerCase() === colorInput.trim().toLowerCase());
                embedColor = Colors[colorKey] || Colors.Blue;
            }

            // 埋め込みメッセージを作成
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(embedColor) // 色を設定
                .setTimestamp();

            // メッセージを送信
            await interaction.reply({ embeds: [embed] });
            const commandName = interaction.commandName;
            const userId = interaction.user.id;
            const username = interaction.user.tag;
            const serverId = interaction.guild?.id || 'DM';
            const reportChannelId = '1354450815074439321';

            // ギルド内での実行時のみログを送信
            if (interaction.guild) {
              const reportChannel = await interaction.guild.channels.fetch(reportChannelId).catch(() => null);
              if (reportChannel) {
                // 成功ログをEmbedで送信
                const logEmbed = new EmbedBuilder()
                  .setTitle('✅ コマンド実行成功')
                  .setColor('Green')
                  .addFields(
                    { name: 'ユーザー', value: `${username} (${userId})`, inline: false },
                    { name: 'サーバーID', value: `${serverId}`, inline: false },
                    { name: 'コマンド', value: `/${commandName}`, inline: false },
                    { name: '結果', value: '✅ 成功', inline: false }
                  )
                  .setTimestamp();

                await reportChannel.send({ embeds: [logEmbed] });
              }
            }
        } catch (error) {
            console.error('エラー:', error);
            await interaction.reply({ content: 'コマンドの実行中にエラーが発生しました。', ephemeral: true });
            const commandName = interaction.commandName;
            const userId = interaction.user.id;
            const username = interaction.user.tag;
            const serverId = interaction.guild?.id || 'DM';
            const reportChannelId = '1354450815074439321';

            if (interaction.guild) {
              const reportChannel = await interaction.guild.channels.fetch(reportChannelId).catch(() => null);
              if (reportChannel) {
                const logEmbed = new EmbedBuilder()
                  .setTitle('❌ コマンド実行エラー')
                  .setColor('Red')
                  .addFields(
                    { name: 'ユーザー', value: `${username} (${userId})`, inline: false },
                    { name: 'サーバーID', value: `${serverId}`, inline: false },
                    { name: 'コマンド', value: `/${commandName}`, inline: false },
                    { name: '結果', value: `❌ エラー\n\`\`\`権限エラー\`\`\``, inline: false }
                  )
                  .setTimestamp();
                return reportChannel.send({ embeds: [logEmbed] });
              }
            }
        }
    },
};

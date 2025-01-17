const { SlashCommandBuilder } = require('discord.js');
const translate = require('@vitalets/google-translate-api'); // 翻訳用ライブラリ

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('テキストを翻訳します')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('翻訳するテキスト')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('target_language')
                .setDescription('翻訳先の言語コード（例: en, ja, fr）')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            // ユーザー入力の取得
            const text = interaction.options.getString('text');
            const targetLanguage = interaction.options.getString('target_language');

            // 翻訳を実行
            const result = await translate(text, { to: targetLanguage });

            // 結果を返信
            await interaction.reply({
                content: `**翻訳結果:**\n\n${result.text}`,
                ephemeral: false // 公開または非公開の設定
            });
        } catch (error) {
            console.error('翻訳エラー:', error);
            await interaction.reply({
                content: '翻訳中にエラーが発生しました。正しい言語コードを使用しているか確認してください。',
                ephemeral: true
            });
        }
    },
};

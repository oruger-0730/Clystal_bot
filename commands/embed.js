const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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
                .setDescription('埋め込みメッセージの色（例: RED, BLUE, GREEN）')
                .setRequired(false)
        ),
    async execute(interaction) {
        // ユーザーからの入力を取得
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color') || 'BLUE'; // 色が指定されていない場合はデフォルトで青

        // EmbedBuilderを使って埋め込みメッセージを作成
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color.toUpperCase()) // 色を大文字に変換
            .setTimestamp();

        // 作成した埋め込みメッセージを送信
        await interaction.reply({
            embeds: [embed],
        });
    },
};

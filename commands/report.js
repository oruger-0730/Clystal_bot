// report.js
const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

// ブラックリスト管理ファイル
const blacklistFile = './blacklist.json';
if (!fs.existsSync(blacklistFile)) {
    fs.writeFileSync(blacklistFile, JSON.stringify({ blacklist: [] }, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('通報フォームを開きます'),
    async execute(interaction) {
        // モーダルウィンドウの作成
        const modal = new ModalBuilder()
            .setCustomId('reportModal')
            .setTitle('通報フォーム');

        const contentInput = new TextInputBuilder()
            .setCustomId('reportContent')
            .setLabel('通報内容を入力してください')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const targetInput = new TextInputBuilder()
            .setCustomId('reportTarget')
            .setLabel('通報先 (ユーザーまたはサーバー)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const actionRow1 = new ActionRowBuilder().addComponents(contentInput);
        const actionRow2 = new ActionRowBuilder().addComponents(targetInput);

        modal.addComponents(actionRow1, actionRow2);

        // モーダルをユーザーに表示
        await interaction.showModal(modal);
    },
    async handleModal(interaction) {
        if (interaction.customId === 'reportModal') {
            const content = interaction.fields.getTextInputValue('reportContent');
            const target = interaction.fields.getTextInputValue('reportTarget');

            const reportChannelId = '1315191471556788285'; // 通報を送信するチャンネルID
            const reportChannel = await interaction.client.channels.fetch(reportChannelId);
            const embed = new EmbedBuilder()
                .setTitle('新しい通報')
                .setDescription(`**通報先**: ${target}\n**内容**:\n${content}`)
                .setColor('RED')
                .setTimestamp()
                .setFooter({ text: `通報者: ${interaction.user.tag}` });

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('approveReport')
                    .setLabel('問題なし')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('warnReport')
                    .setLabel('警告')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('banReport')
                    .setLabel('利用停止')
                    .setStyle(ButtonStyle.Danger)
            );

            await reportChannel.send({ embeds: [embed], components: [buttons] });
            await interaction.reply({ content: '通報を送信しました！', ephemeral: true });
        }
    },
    async handleButton(interaction) {
        const blacklist = JSON.parse(fs.readFileSync(blacklistFile, 'utf8'));
        const message = interaction.message;

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'あなたには権限がありません。', ephemeral: true });
        }

        const target = message.embeds[0].description.split('\n')[0].split(': ')[1];

        if (interaction.customId === 'approveReport') {
            await interaction.update({
                content: 'この通報は「問題なし」と判断されました。',
                components: [],
            });
        } else if (interaction.customId === 'warnReport') {
            let warnMessage = '通報内容に対する警告が送信されました。';
            
            // targetがユーザーIDであれば、ユーザーへ直接警告を送信
            if (target.match(/^<@!?(\d+)>$/)) {
                const userId = target.match(/^<@!?(\d+)>$/)[1];
                const user = await interaction.client.users.fetch(userId);
                warnMessage = `あなたは本チームが定める利用規約に違反している恐れがあります。今後は利用規約を尊重して使用してください。`;
                await user.send(warnMessage);
            } else {
                warnMessage = 'サーバーに対する警告を送信しました。';
            }

            await interaction.update({
                content: warnMessage,
                components: [],
            });
        } else if (interaction.customId === 'banReport') {
            // ここでブラックリストに追加
            if (!blacklist.blacklist.includes(target)) {
                blacklist.blacklist.push(target);
                fs.writeFileSync(blacklistFile, JSON.stringify(blacklist, null, 2));
            }

            await interaction.update({
                content: 'この通報は「利用停止」として処理されました。',
                components: [],
            });
        }
    },
};

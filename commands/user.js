const { SlashCommandBuilder, EmbedBuilder,ButtonBuilder, ActionRowBuilder, ButtonStyle, Colors } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('指定したユーザーの情報を表示します。')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('ユーザーを指定します。')
                .setRequired(false)), // ユーザー選択は任意
    async execute(interaction) {
        // 対象のユーザーを取得（指定されていない場合は自分）
        const targetUser = interaction.options.getUser('target') || interaction.user;
        const targetMember = interaction.guild.members.cache.get(targetUser.id);

        // アカウント作成日を取得
        const accountCreationDate = targetUser.createdAt;
        const daysSinceCreation = Math.floor((Date.now() - accountCreationDate) / (1000 * 60 * 60 * 24));

        // ユーザーのステータスを取得
        const status = {
            "online": "🟢オンライン",
            "offline": "⚫オフライン",
            "dnd": "⛔取り込み中",
            "idle": "🌙退席中"
          } // オンラインステータスの確認

        // 使用デバイスの取得
        const device = targetMember.presence ? targetMember.presence.clientStatus : null;
        let deviceStatus = '不明';
        if (device) {
            if (device.web) deviceStatus = 'Web';
            else if (device.desktop) deviceStatus = 'PC';
            else if (device.mobile) deviceStatus = 'モバイル';
        }

        // 埋め込みメッセージの作成
        const embed = new EmbedBuilder()
            .setColor(0x00AEFF) // 青色
            .setTitle(`${targetUser.tag} の情報`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 })) // ユーザーアイコン
            .addFields(
                { name: 'ユーザー ID', value: targetUser.id, inline: true },
                { name: 'ステータス', value: interaction.member.presence?.status ? `${status[interaction.member.presence?.status]}\n${platform(interaction.member.presence)||""}` : "取得不可", inline: true },
                { name: 'アカウント作成日', value: `${daysSinceCreation} 日前`, inline: true },
                { name: '使用デバイス', value: deviceStatus, inline: true }
            )
            .setTimestamp();

        // 埋め込みメッセージを送信
        await interaction.reply({ embeds: [embed] });
    },
};

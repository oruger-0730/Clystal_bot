const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("auditlog")
    .setDescription("サーバーの最新の監査ログを取得します"),

  async execute(interaction) {
    // 実行権限チェック（監査ログの表示権限）
    const member = interaction.member;
    if (!member.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
      return interaction.reply({
        content: "⚠️ このコマンドを実行するには **監査ログを表示** 権限が必要です。",
        ephemeral: true,
      });
    }

    try {
      const logs = await interaction.guild.fetchAuditLogs({ limit: 10 });
      const entries = logs.entries.map(entry => {
        const executor = entry.executor?.tag || "不明";
        const target = entry.target?.tag || entry.target?.name || entry.targetId || "不明";
        const action = entry.actionType;
        const reason = entry.reason || "なし";
        const time = `<t:${Math.floor(entry.createdTimestamp / 1000)}:f>`;

        return {
          executor,
          target,
          action,
          reason,
          time
        };
      });

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("📋 最新の監査ログ（最大10件）")
        .setTimestamp();

      for (const [i, entry] of entries.entries()) {
        embed.addFields({
          name: `#${i + 1} - ${entry.action}`,
          value:
            `👤 実行者: ${entry.executor}\n` +
            `🎯 対象: ${entry.target}\n` +
            `📝 理由: ${entry.reason}\n` +
            `🕒 実行日時: ${entry.time}`,
        });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error("監査ログ取得エラー:", err);
      await interaction.reply({
        content: "⚠️ 監査ログを取得できませんでした。Botに `監査ログの表示` 権限があるか確認してください。",
        ephemeral: true,
      });
    }
  },
};

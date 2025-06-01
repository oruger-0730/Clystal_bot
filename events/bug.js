const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "bugReportModal") return;

    try {
      const executedCommand = interaction.fields.getTextInputValue("executedCommand");
      const issueDescription = interaction.fields.getTextInputValue("issueDescription");

      const reportChannel = await client.channels.fetch("1361280308753993800");
      if (!reportChannel || !reportChannel.isTextBased()) {
        return await interaction.reply({
          content: "報告チャンネルが見つかりませんでした。",
          ephemeral: true,
        });
      }

      const bugReportEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("バグ報告詳細")
        .setDescription("以下はユーザーからのバグ報告です。")
        .addFields(
          {
            name: "ユーザー情報",
            value: `${interaction.user.tag} (${interaction.user.id})`,
            inline: true,
          },
          { name: "実行したコマンド", value: executedCommand, inline: false },
          { name: "発生した問題", value: issueDescription, inline: false }
        )
        .setTimestamp();

      await reportChannel.send({ embeds: [bugReportEmbed] });

      // ログ送信処理
      const commandName = interaction.commandName || "（不明）";
      const userId = interaction.user.id;
      const username = interaction.user.tag;
      const serverId = interaction.guild?.id || "DM";
      const reportChannelId = "1354450815074439321";

      if (interaction.guild) {
        const logChannel = await interaction.guild.channels.fetch(reportChannelId).catch(() => null);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("✅ コマンド実行成功")
            .setColor("Green")
            .addFields(
              { name: "ユーザー", value: `${username} (${userId})`, inline: false },
              { name: "サーバーID", value: `${serverId}`, inline: false },
              { name: "コマンド", value: `/${commandName}`, inline: false },
              { name: "結果", value: "✅ 成功", inline: false }
            )
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      }

      await interaction.reply({
        content: "バグ報告を送信しました。ご協力ありがとうございます！",
        ephemeral: true,
      });
    } catch (error) {
      console.error("❌ バグ報告の送信中にエラー:", error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "バグ報告の送信中にエラーが発生しました。",
          ephemeral: true,
        });
      }
    }
  },
};

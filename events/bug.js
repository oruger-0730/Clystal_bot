const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "bugReportModal") return;

    try {
      const executedCommand = interaction.fields.getTextInputValue("executedCommand");
      const issueDescription = interaction.fields.getTextInputValue("issueDescription");

      const reportChannel = await interaction.client.channels.fetch("1361280308753993800");
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

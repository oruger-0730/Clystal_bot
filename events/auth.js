const auth = require("../commands/auth");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    try {
      await auth.handleInteraction(interaction);
    } catch (error) {
      console.error("auth.handleInteraction 実行中のエラー:", error);
    }
  },
};

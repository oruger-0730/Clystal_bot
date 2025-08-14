const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const messageDataPath = './json/message_statistics.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('statistics')
    .setDescription('統計情報を表示します')
    .addSubcommand(sub =>
      sub
        .setName('ping')
        .setDescription('過去のPing推移を表示します')
    )
    .addSubcommand(sub =>
      sub.setName('message').setDescription('メッセージ数（1日ごと）を表示')
    )
    .addSubcommand(sub =>
      sub.setName('command').setDescription('総コマンド実行数を表示')
　　),


  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'ping') {
      const path = './json/ping_history.json';

      if (!fs.existsSync(path)) {
        return interaction.reply({ content: 'Pingデータがまだありません。', ephemeral: true });
      }

      const data = JSON.parse(fs.readFileSync(path, 'utf8'));
      const labels = data.map(entry => new Date(entry.time).toLocaleTimeString());
      const pings = data.map(entry => entry.ping);

      const chartConfig = {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Ping (ms)',
            data: pings,
            borderColor: 'rgba(75, 192, 192, 1)',
            fill: false
          }]
        },
        options: {
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
};

      const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&backgroundColor=white`;

      const embed = new EmbedBuilder()
        .setTitle('📊 Ping統計')
        .setDescription('過去のPingの推移グラフです。')
        .setImage(chartUrl)
        .setColor('Blue')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } else if (subcommand === 'message') {
  if (!fs.existsSync(messageDataPath)) {
    return interaction.reply({ content: 'まだ統計データがありません。', ephemeral: true });
  }

  const statistics = JSON.parse(fs.readFileSync(messageDataPath, 'utf8'));
  const guildId = interaction.guild.id;
  const guildStats = statistics[guildId];

  if (!guildStats) {
    return interaction.reply({ content: 'このサーバーのデータがありません。', ephemeral: true });
  }

  const sortedEntries = Object.entries(guildStats)
    .sort(([a], [b]) => new Date(a) - new Date(b))
    .slice(-30); // 過去30日間のみ

  const labels = sortedEntries.map(([date]) =>
    new Date(date).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })
  );
  const values = sortedEntries.map(([, count]) => count);

  const chartConfig = {
  type: 'bar',
  data: {
    labels: labels,
    datasets: [{
      label: 'メッセージ数',
      data: values,
      backgroundColor: 'rgba(54, 162, 235, 0.6)'
    }]
  },
  options: {
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: '過去30日間のメッセージ数'
      }
    }
  }
};

const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&backgroundColor=white`;

  const embed = new EmbedBuilder()
    .setTitle(`${interaction.guild.name} のメッセージ統計（30日間）`)
    .setDescription('1日ごとのメッセージ数を以下に表示しています。')
    .setImage(chartUrl)
    .setColor(0x00bfff)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
} else if (subcommand === 'command') {
  const commandPath = './json/command_statistics.json';

  if (!fs.existsSync(commandPath)) {
    return interaction.reply({ content: 'まだコマンド統計データがありません。', ephemeral: true });
  }

  const stats = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
  const sorted = Object.entries(stats).sort(([a], [b]) => new Date(a) - new Date(b)).slice(-30);

  const labels = sorted.map(([date]) => new Date(date).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }));
  const values = sorted.map(([, count]) => count);

  const chartConfig = {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'コマンド実行数',
        data: values,
        backgroundColor: 'rgba(255, 99, 132, 0.6)'
      }]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: '過去30日間のコマンド実行数'
        }
      }
    }
  };

  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&backgroundColor=white`;

  const embed = new EmbedBuilder()
    .setTitle('📈 全体のコマンド実行統計（30日間）')
    .setDescription('全サーバー合計のコマンド実行数を表示します。')
    .setImage(chartUrl)
    .setColor(0x00bfff)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
  }
};

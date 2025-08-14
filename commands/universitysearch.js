// commands/universitysearch.js
const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

// ESM対応fetch (node-fetchはESMのみ)
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// 都道府県名→コード対応表
const prefectureMap = {
  '北海道': '1', '青森': '2', '岩手': '3', '宮城': '4', '秋田': '5', '山形': '6', '福島': '7',
  '茨城': '8', '栃木': '9', '群馬': '10', '埼玉': '11', '千葉': '12', '東京': '13', '神奈川': '14',
  '新潟': '15', '富山': '16', '石川': '17', '福井': '18', '山梨': '19', '長野': '20',
  '岐阜': '21', '静岡': '22', '愛知': '23', '三重': '24',
  '滋賀': '25', '京都': '26', '大阪': '27', '兵庫': '28', '奈良': '29', '和歌山': '30',
  '鳥取': '31', '島根': '32', '岡山': '33', '広島': '34', '山口': '35',
  '徳島': '36', '香川': '37', '愛媛': '38', '高知': '39',
  '福岡': '40', '佐賀': '41', '長崎': '42', '熊本': '43', '大分': '44', '宮崎': '45', '鹿児島': '46', '沖縄': '47'
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('universitysearch')
    .setDescription('日本の大学を検索します')
    .addStringOption(opt =>
      opt.setName('region')
        .setDescription('都道府県（例: 東京, 大阪）')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('faculty')
        .setDescription('学部名（例: 薬学部）')
        .setRequired(false))
    .addIntegerOption(opt =>
      opt.setName('偏差値')
        .setDescription('偏差値（現時点では未使用）')
        .setRequired(false)),

  async execute(interaction) {
    const region = interaction.options.getString('region');
    const faculty = interaction.options.getString('faculty') || '';

    const prefCode = prefectureMap[region];
    if (!prefCode) {
      return interaction.reply({
        content: `❌ 地域「${region}」は無効です。正しい都道府県名を指定してください。`,
        ephemeral: true
      });
    }

    try {
      const url = new URL('https://api.edu-data.jp/api/v1/school');
      url.searchParams.set('school_type_code', 'F1'); // 大学
      url.searchParams.set('pref_code', prefCode);
      if (faculty) url.searchParams.set('keyword', `${region} 大学 ${faculty}`);
      else url.searchParams.set('keyword', `${region} 大学`);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: 'Bearer 416|a2xR2vwNYX0e1ubce1RUTPHpdBsPo0sozBSRnsz9'
        }
      });

      if (!res.ok) throw new Error(`APIエラー: ${res.status}`);
      const json = await res.json();
      const universities = json.data;

      if (!Array.isArray(universities) || universities.length === 0) {
        return interaction.reply({ content: '🔍 該当する大学は見つかりませんでした。', ephemeral: true });
      }

      const top10 = universities.slice(0, 10);
      const embed = new EmbedBuilder()
        .setTitle(`大学検索結果（${region}）`)
        .setDescription(top10.map(u => `🏫 ${u.school_name}`).join('\n'))
        .setColor('Blue')
        .setFooter({ text: '最大10件まで表示しています' });

      return interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('[大学検索エラー]:', err);
      return interaction.reply({ content: `❌ 大学検索中にエラーが発生しました: ${err.message}`, ephemeral: true });
    }
  }
};

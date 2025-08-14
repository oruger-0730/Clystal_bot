const { SlashCommandBuilder , EmbedBuilder } = require('discord.js');
const math = require('mathjs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('math')
    .setDescription('数式計算や関数・方程式の解を求めます')
    .addSubcommand(sub =>
      sub.setName('calc')
        .setDescription('任意の数式を計算')
        .addStringOption(opt => opt.setName('expression').setDescription('例: 3 + 4 * 2').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('linear_func')
        .setDescription('一次関数 f(x) = ax + b のf(x)を計算')
        .addNumberOption(opt => opt.setName('a').setDescription('a の値').setRequired(true))
        .addNumberOption(opt => opt.setName('b').setDescription('b の値').setRequired(true))
        .addNumberOption(opt => opt.setName('x').setDescription('x の値').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('linear_eq')
        .setDescription('一次方程式 ax + b = 0 を解く')
        .addNumberOption(opt => opt.setName('a').setDescription('a の値').setRequired(true))
        .addNumberOption(opt => opt.setName('b').setDescription('b の値').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('quadratic_func')
        .setDescription('二次関数 f(x) = ax² + bx + c のf(x)を計算')
        .addNumberOption(opt => opt.setName('a').setDescription('a の値').setRequired(true))
        .addNumberOption(opt => opt.setName('b').setDescription('b の値').setRequired(true))
        .addNumberOption(opt => opt.setName('c').setDescription('c の値').setRequired(true))
        .addNumberOption(opt => opt.setName('x').setDescription('x の値').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('quadratic_eq')
        .setDescription('二次方程式 ax² + bx + c = 0 を解く')
        .addNumberOption(opt => opt.setName('a').setDescription('a の値').setRequired(true))
        .addNumberOption(opt => opt.setName('b').setDescription('b の値').setRequired(true))
        .addNumberOption(opt => opt.setName('c').setDescription('c の値').setRequired(true))),
  
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const embed = new EmbedBuilder().setColor('Blue');

    try {
      if (sub === 'calc') {
        const expression = interaction.options.getString('expression');
        const result = math.evaluate(expression);
        embed.setTitle('🧮 計算結果').addFields(
          { name: '式', value: `\`${expression}\`` },
          { name: '結果', value: `\`${result}\`` }
        );
      }

      if (sub === 'linear_func') {
        const a = interaction.options.getNumber('a');
        const b = interaction.options.getNumber('b');
        const x = interaction.options.getNumber('x');
        const y = a * x + b;
        embed.setTitle('📈 一次関数').setDescription(`f(x) = ${a}x + ${b}\nf(${x}) = **${y}**`);
      }

      if (sub === 'linear_eq') {
        const a = interaction.options.getNumber('a');
        const b = interaction.options.getNumber('b');
        if (a === 0) {
          embed.setTitle('⚠️ エラー').setDescription(b === 0 ? '無限解があります。' : '解は存在しません。');
        } else {
          const x = -b / a;
          embed.setTitle('🧩 一次方程式').setDescription(`${a}x + ${b} = 0 の解は **x = ${x}**`);
        }
      }

      if (sub === 'quadratic_func') {
        const a = interaction.options.getNumber('a');
        const b = interaction.options.getNumber('b');
        const c = interaction.options.getNumber('c');
        const x = interaction.options.getNumber('x');
        const y = a * x * x + b * x + c;
        embed.setTitle('📉 二次関数').setDescription(`f(x) = ${a}x² + ${b}x + ${c}\nf(${x}) = **${y}**`);
      }

      if (sub === 'quadratic_eq') {
        const a = interaction.options.getNumber('a');
        const b = interaction.options.getNumber('b');
        const c = interaction.options.getNumber('c');
        const d = b * b - 4 * a * c;
        embed.setTitle('🧠 二次方程式');
        if (a === 0) {
          embed.setDescription('a = 0 のため、一次方程式として扱う必要があります。');
        } else if (d < 0) {
          embed.setDescription(`解なし（判別式 D = ${d} < 0）`);
        } else if (d === 0) {
          const x = -b / (2 * a);
          embed.setDescription(`重解あり: x = **${x}**`);
        } else {
          const sqrtD = Math.sqrt(d);
          const x1 = (-b + sqrtD) / (2 * a);
          const x2 = (-b - sqrtD) / (2 * a);
          embed.setDescription(`2つの解:\nx₁ = **${x1}**\nx₂ = **${x2}**`);
        }
      }

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: `エラーが発生しました: \`${err.message}\``,
        ephemeral: true,
      });
    }
  }
};
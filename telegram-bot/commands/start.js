const fetch = require('node-fetch');
const os = require('os');
const { execSync } = require('child_process');
const { PANEL_DOMAIN, PANEL_API_KEY } = require('../config');

module.exports = function statusMenuCommand(bot) {
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;

        try {
            const uptimeSeconds = process.uptime();
            const hours = Math.floor(uptimeSeconds / 3600);
            const minutes = Math.floor((uptimeSeconds % 3600) / 60);
            const seconds = Math.floor(uptimeSeconds % 60);
            const uptime = `${hours}h ${minutes}m ${seconds}s`;

            const start = Date.now();

            const usersRes = await fetch(PANEL_DOMAIN + '/api/application/users', {
                method: 'GET',
                headers: { Accept: 'application/json', Authorization: 'Bearer ' + PANEL_API_KEY }
            });
            const usersData = await usersRes.json();
            const numUsers = usersData.data ? usersData.data.length : 0;

            const serversRes = await fetch(PANEL_DOMAIN + '/api/application/servers', {
                method: 'GET',
                headers: { Accept: 'application/json', Authorization: 'Bearer ' + PANEL_API_KEY }
            });
            const serversData = await serversRes.json();
            const numServers = serversData.data ? serversData.data.length : 0;

            const ping = Date.now() - start;

            const dateEAT = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));

            const cpuModel = os.cpus()[0].model;
            const cpuCores = os.cpus().length;

            const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB";
            const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + " GB";

            let diskInfo = execSync("df -h --total | grep total").toString().split(/\s+/);
            const totalDisk = diskInfo[1];
            const usedDisk = diskInfo[2];
            const freeDisk = diskInfo[3];

            const vpsText = `
🖥️ *VPS DETAILS*
┃⭔ *CPU:* ${cpuModel}
┃⭔ *Cores:* ${cpuCores}
┃⭔ *RAM:* ${totalRam}
┃⭔ *Free RAM:* ${freeRam}
┃⭔ *Disk:* ${totalDisk}
┃⭔ *Used Disk:* ${usedDisk}
┃⭔ *Free Disk:* ${freeDisk}
┃⭔ *OS:* ${os.platform().toUpperCase()}
┃⭔ *Arch:* ${os.arch().toUpperCase()}
`;

            const statusText = `
🤖 *BOT STATUS*
┃⭔ *Bot Name:* Trashx C.P
┃⭔ *Bot Creator:* Putra Modz
┃⭔ *Your Telegram ID:* ${msg.from.id}
┃⭔ *Panel Users:* ${numUsers}
┃⭔ *Panel Servers:* ${numServers}
┃⭔ *Bot Uptime:* ${uptime}
┃⭔ *Ping:* ${ping}ms
┃⭔ *Date (EAT):* ${dateEAT.toLocaleString('en-GB')}

${vpsText}

Type /help to see available commands.
`;

            await bot.sendMessage(chatId, statusText, { parse_mode: 'Markdown' });

        } catch (err) {
            bot.sendMessage(chatId, '❌ Error fetching status: ' + err.message);
        }
    });
};

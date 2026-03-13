const fetch = require('node-fetch');
const { PANEL_DOMAIN, PANEL_API_KEY, GLOBAL_EGG, GLOBAL_LOCATION } = require('../config');

function getLimits(type) {
    if(type === 'unli') return { memory: 0, cpu: 0, disk: 0 };
    const ram = parseInt(type.replace('gb','')) * 1024;
    return { memory: ram, cpu: 50, disk: ram * 2 };
}

module.exports = function createServerCommand(bot, AUTHORIZED_ADMINS) {
    bot.onText(/\/(unli|[1-9]0?gb) (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        if(!AUTHORIZED_ADMINS.includes(chatId)) return bot.sendMessage(chatId, '❌ You are not authorized.');

        const type = match[1];
        const input = match[2];
        const [username, telegramID] = input.split(',').map(i => i.trim());
        if(!username || !telegramID) return bot.sendMessage(chatId, '❌ Invalid format. Use: /1gb username,telegramID');

        const limits = getLimits(type);
        const email = username + "@gmail.com";
        const password = username + '001';

        try {
            const f = await fetch(PANEL_DOMAIN + "/api/application/users", {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: "Bearer " + PANEL_API_KEY },
                body: JSON.stringify({ email, username, first_name: username, last_name: username, language: "en", password })
            });
            const data = await f.json();
            if(data.errors) return bot.sendMessage(chatId, '❌ ' + JSON.stringify(data.errors[0]));
            const user = data.attributes;

            const f2 = await fetch(PANEL_DOMAIN + "/api/application/nests/5/eggs/" + GLOBAL_EGG, {
                method: "GET",
                headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: "Bearer " + PANEL_API_KEY }
            });
            const data2 = await f2.json();
            const startup_cmd = data2.attributes.startup;

            const f3 = await fetch(PANEL_DOMAIN + "/api/application/servers", {
                method: "POST",
                headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: "Bearer " + PANEL_API_KEY },
                body: JSON.stringify({
                    name: username + ' - ' + type.toUpperCase(),
                    description: 'Created with Telegram Bot',
                    user: user.id,
                    egg: parseInt(GLOBAL_EGG),
                    docker_image: "ghcr.io/parkervcp/yolks:nodejs_24",
                    startup: startup_cmd,
                    environment: { INST: "npm", USER_UPLOAD: "0", AUTO_UPDATE: "0", CMD_RUN: "npm start" },
                    limits: { memory: limits.memory, swap: 0, disk: limits.disk, io: 500, cpu: limits.cpu },
                    feature_limits: { databases: 5, backups: 5, allocations: 5 },
                    deploy: { locations: [parseInt(GLOBAL_LOCATION)], dedicated_ip: false, port_range: [] }
                })
            });
            const res = await f3.json();
            if(res.errors) return bot.sendMessage(chatId, '❌ ' + JSON.stringify(res.errors[0]));

            const messageText = `✅ Your user and server have been created!

👤 Username: ${username}
🔐 Password: ${password}
🔗 Panel URL: ${PANEL_DOMAIN}`;

            const imageUrl = 'https://files.catbox.moe/0tfo76.jpeg';

            await bot.sendPhoto(telegramID, imageUrl, { caption: messageText });

            bot.sendMessage(chatId, `✅ Successfully created user and server for ${username}\nType: ${type.toUpperCase()}`);
        } catch (err) {
            bot.sendMessage(chatId, '❌ Error: ' + err.message);
        }
    });
};

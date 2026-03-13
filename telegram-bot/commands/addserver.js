const fetch = require('node-fetch');
const { PANEL_DOMAIN, PANEL_API_KEY, GLOBAL_EGG, GLOBAL_LOCATION } = require('../config');

function getLimits(type) {
    if (type === 'unli') {
        return { memory: 0, cpu: 0, disk: 0 };
    }
    const ram = parseInt(type.replace('gb', '')) * 1024;
    return { memory: ram, cpu: 50, disk: ram * 2 };
}

module.exports = function addServerCommand(bot, AUTHORIZED_ADMINS) {

    bot.onText(/\/addserver (\S+) (unli|[1-9]0?gb) (\S+)/, async (msg, match) => {
        const chatId = msg.chat.id;

        if (!AUTHORIZED_ADMINS.includes(chatId)) {
            return bot.sendMessage(chatId, '❌ You are not authorized.');
        }

        const serverName = match[1];
        const ramType = match[2];
        const username = match[3];

        const limits = getLimits(ramType);

        try {
            const usersRes = await fetch(`${PANEL_DOMAIN}/api/application/users`, {
                headers: {
                    Accept: 'application/json',
                    Authorization: 'Bearer ' + PANEL_API_KEY
                }
            });
            const usersData = await usersRes.json();

            const user = usersData.data.find(
                u => u.attributes.username === username
            );

            if (!user) {
                return bot.sendMessage(chatId, `❌ User *${username}* not found.`, {
                    parse_mode: 'Markdown'
                });
            }

            const userId = user.attributes.id;

            const eggRes = await fetch(
                `${PANEL_DOMAIN}/api/application/nests/5/eggs/${GLOBAL_EGG}`,
                {
                    headers: {
                        Accept: 'application/json',
                        Authorization: 'Bearer ' + PANEL_API_KEY
                    }
                }
            );
            const eggData = await eggRes.json();
            const startup_cmd = eggData.attributes.startup;

            const serverRes = await fetch(`${PANEL_DOMAIN}/api/application/servers`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + PANEL_API_KEY
                },
                body: JSON.stringify({
                    name: `${serverName} - ${ramType.toUpperCase()}`,
                    description: 'Added via Telegram Bot',
                    user: userId,
                    egg: parseInt(GLOBAL_EGG),
                    docker_image: 'ghcr.io/parkervcp/yolks:nodejs_24',
                    startup: startup_cmd,
                    environment: {
                        INST: 'npm',
                        USER_UPLOAD: '0',
                        AUTO_UPDATE: '0',
                        CMD_RUN: 'npm start'
                    },
                    limits: {
                        memory: limits.memory,
                        swap: 0,
                        disk: limits.disk,
                        io: 500,
                        cpu: limits.cpu
                    },
                    feature_limits: {
                        databases: 5,
                        backups: 5,
                        allocations: 5
                    },
                    deploy: {
                        locations: [parseInt(GLOBAL_LOCATION)],
                        dedicated_ip: false,
                        port_range: []
                    }
                })
            });

            const serverData = await serverRes.json();
            if (serverData.errors) {
                return bot.sendMessage(chatId, '❌ ' + JSON.stringify(serverData.errors[0]));
            }

            bot.sendMessage(
                chatId,
                `✅ *Server Created Successfully*\n\n🖥️ Name: *${serverName}*\n👤 User: *${username}*\n💾 RAM: *${ramType.toUpperCase()}*`,
                { parse_mode: 'Markdown' }
            );

        } catch (err) {
            bot.sendMessage(chatId, '❌ Error: ' + err.message);
        }
    });
};

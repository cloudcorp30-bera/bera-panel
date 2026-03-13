const fetch = require('node-fetch');
const { PANEL_DOMAIN, PANEL_API_KEY } = require('../config');

module.exports = function delServerCommand(bot, AUTHORIZED_ADMINS) {
    bot.onText(/\/delserver (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;

        if (!AUTHORIZED_ADMINS.includes(chatId)) {
            return bot.sendMessage(chatId, '❌ You are not authorized to use this command.');
        }

        const serverIdOrName = match[1].trim();
        if (!serverIdOrName) return bot.sendMessage(chatId, '❌ Usage: /delserver <serverID or serverName>');

        try {
            const res = await fetch(PANEL_DOMAIN + '/api/application/servers', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + PANEL_API_KEY
                }
            });

            const data = await res.json();
            if (data.errors) return bot.sendMessage(chatId, '❌ ' + JSON.stringify(data.errors[0]));

            const servers = data.data;
            const server = servers.find(s => s.attributes.id == serverIdOrName || s.attributes.name === serverIdOrName);

            if (!server) return bot.sendMessage(chatId, `❌ Server "${serverIdOrName}" not found.`);

            const delRes = await fetch(PANEL_DOMAIN + `/api/application/servers/${server.attributes.id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + PANEL_API_KEY
                }
            });

            if (delRes.status === 204) {
                return bot.sendMessage(chatId, `✅ Server "${server.attributes.name}" (ID: ${server.attributes.id}) has been deleted successfully.`);
            } else {
                const errData = await delRes.json();
                return bot.sendMessage(chatId, '❌ Error: ' + JSON.stringify(errData));
            }
        } catch (err) {
            bot.sendMessage(chatId, '❌ Error: ' + err.message);
        }
    });
};

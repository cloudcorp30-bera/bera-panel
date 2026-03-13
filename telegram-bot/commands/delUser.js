const fetch = require('node-fetch');
const { PANEL_DOMAIN, PANEL_API_KEY } = require('../config');

module.exports = function delUserCommand(bot, AUTHORIZED_ADMINS) {
    bot.onText(/\/deluser (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;

        if (!AUTHORIZED_ADMINS.includes(chatId)) {
            return bot.sendMessage(chatId, '❌ You are not authorized to use this command.');
        }

        const usernameOrId = match[1].trim();
        if (!usernameOrId) return bot.sendMessage(chatId, '❌ Usage: /deluser <username or userID>');

        try {
            const res = await fetch(PANEL_DOMAIN + '/api/application/users', {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + PANEL_API_KEY
                }
            });
            const data = await res.json();

            if (data.errors) return bot.sendMessage(chatId, '❌ ' + JSON.stringify(data.errors[0]));

            const users = data.data;
            const user = users.find(u => u.attributes.username === usernameOrId || u.attributes.id == usernameOrId);

            if (!user) return bot.sendMessage(chatId, `❌ User "${usernameOrId}" not found.`);

            const delRes = await fetch(PANEL_DOMAIN + `/api/application/users/${user.attributes.id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + PANEL_API_KEY
                }
            });

            if (delRes.status === 204) {
                return bot.sendMessage(chatId, `✅ User "${user.attributes.username}" (ID: ${user.attributes.id}) has been deleted successfully.`);
            } else {
                const errData = await delRes.json();
                return bot.sendMessage(chatId, '❌ Error: ' + JSON.stringify(errData));
            }
        } catch (err) {
            bot.sendMessage(chatId, '❌ Error: ' + err.message);
        }
    });
};

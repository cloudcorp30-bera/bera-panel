const fetch = require('node-fetch');
const { PANEL_DOMAIN, PANEL_API_KEY } = require('../config');

module.exports = function cadminPanelCommand(bot, AUTHORIZED_ADMINS) {

    bot.onText(/\/cadminpanel (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;

        if (!AUTHORIZED_ADMINS.includes(chatId)) {
            return bot.sendMessage(chatId, "❌ You are not authorized to create panel admins.");
        }

        const input = match[1];
        const [username, email] = input.split(',').map(i => i.trim());

        if (!username || !email) {
            return bot.sendMessage(chatId, "❌ Invalid format.\nUse:\n`/cadminpanel username,email`", {
                parse_mode: "Markdown"
            });
        }

        const password = username + "Admin001";

        try {
            const res = await fetch(PANEL_DOMAIN + "/api/application/users", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + PANEL_API_KEY
                },
                body: JSON.stringify({
                    email,
                    username,
                    first_name: username,
                    last_name: "Admin",
                    language: "en",
                    password,
                    root_admin: true
                })
            });

            const data = await res.json();

            if (data.errors) {
                return bot.sendMessage(chatId, "❌ Error: " + JSON.stringify(data.errors[0]));
            }

            const message = `
✅ *Panel Admin User Created*

👤 Username: *${username}*
📧 Email: *${email}*
🔐 Password: *${password}*
⚡ Role: *Administrator*
🔗 Panel: ${PANEL_DOMAIN}

Tell the admin to change their password immediately.
`;

            bot.sendMessage(chatId, message, { parse_mode: "Markdown" });

        } catch (err) {
            bot.sendMessage(chatId, "❌ Error: " + err.message);
        }
    });
};

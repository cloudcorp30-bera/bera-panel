const fetch = require('node-fetch');
const { PANEL_DOMAIN, PANEL_API_KEY } = require('../config');

module.exports = function createUserCommand(bot, AUTHORIZED_ADMINS) {

    bot.onText(/\/createuser (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;

        if (!AUTHORIZED_ADMINS.includes(chatId)) {
            return bot.sendMessage(chatId, '❌ You are not authorized.');
        }

        const input = match[1];
        const [username, email] = input.split(',').map(v => v.trim());

        if (!username || !email) {
            return bot.sendMessage(
                chatId,
                '❌ Invalid format.\nUse:\n/createuser username,email'
            );
        }

        const password = username + '001';

        try {
            const res = await fetch(`${PANEL_DOMAIN}/api/application/users`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer ' + PANEL_API_KEY
                },
                body: JSON.stringify({
                    email,
                    username,
                    first_name: username,
                    last_name: 'User',
                    language: 'en',
                    password,
                    root_admin: false
                })
            });

            const data = await res.json();

            if (data.errors) {
                return bot.sendMessage(chatId, '❌ ' + JSON.stringify(data.errors[0]));
            }

            const user = data.attributes;

            const text = `
✅ *Panel User Created Successfully*

👤 Username: *${user.username}*
📧 Email: *${user.email}*
🔐 Password: *${password}*
🆔 User ID: *${user.id}*
🔗 Panel: ${PANEL_DOMAIN}

⚠ Please change your password after login.
`;

            bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

        } catch (err) {
            bot.sendMessage(chatId, '❌ Error: ' + err.message);
        }
    });
};

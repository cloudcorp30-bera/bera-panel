module.exports = function menuCommand(bot) {
    bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        const text = `
📋 *Available Commands*

👤 *User Management*
/createuser username,email — Create a panel user
/cadminpanel username,email — Create an admin user
/listusers — List all panel users
/deluser username — Delete a user

🖥️ *Server Management*
/addserver name ram username — Add server to existing user
/1gb username,telegramID — Create user + 1GB server
/2gb username,telegramID — Create user + 2GB server
/unli username,telegramID — Create user + unlimited server
/listservers — List all servers
/delserver name — Delete a server

👑 *Admin*
/listpaneladmins — List all panel admins

📊 *Status*
/start — Bot & VPS status
`;
        bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    });
};

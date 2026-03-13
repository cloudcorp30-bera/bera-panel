const TelegramBot = require('node-telegram-bot-api');
const createServerCommand = require('./commands/createServer');
const menuCommand = require('./commands/menu');
const listUsersCommand = require('./commands/listUsers');
const listServersCommand = require('./commands/listServers');
const delUserCommand = require('./commands/delUser');
const delServerCommand = require('./commands/delServer');
const statusMenuCommand = require('./commands/start');
const cadminPanelCommand = require('./commands/cadminpanel');
const listPanelAdminsCommand = require('./commands/listpaneladmins');
const createUserCommand = require('./commands/createuser');
const addServerCommand = require('./commands/addserver');

const { TELEGRAM_TOKEN, AUTHORIZED_ADMINS } = require('./config');

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

menuCommand(bot);
createServerCommand(bot, AUTHORIZED_ADMINS);
listUsersCommand(bot, AUTHORIZED_ADMINS);
listServersCommand(bot, AUTHORIZED_ADMINS);
delUserCommand(bot, AUTHORIZED_ADMINS);
delServerCommand(bot, AUTHORIZED_ADMINS);
statusMenuCommand(bot);
cadminPanelCommand(bot, AUTHORIZED_ADMINS);
listPanelAdminsCommand(bot, AUTHORIZED_ADMINS);
createUserCommand(bot, AUTHORIZED_ADMINS);
addServerCommand(bot, AUTHORIZED_ADMINS);

bot.getMe().then((me) => {
    console.log(`✅ Telegram bot @${me.username} is running...`);
}).catch((err) => {
    console.error('❌ Failed to get bot info:', err);
});

bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

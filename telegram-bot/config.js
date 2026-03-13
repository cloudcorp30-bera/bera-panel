module.exports = {
    TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN || '8648971888:AAE0VoGdrjrAtNNUYOuMlilaK8f3vKzlPcA',
    PANEL_DOMAIN: process.env.PANEL_DOMAIN || 'https://bera-panel-production.up.railway.app',
    PANEL_API_KEY: process.env.PANEL_API_KEY || 'ptla_8gN5bQmWGHaOKdDZY8uqGlEC8InTE0MtubBj3ZgQ4Tn',
    AUTHORIZED_ADMINS: (process.env.AUTHORIZED_ADMINS || '7038158483').split(',').map(Number),
    GLOBAL_EGG: process.env.GLOBAL_EGG || '15',
    GLOBAL_LOCATION: process.env.GLOBAL_LOCATION || '1'
};

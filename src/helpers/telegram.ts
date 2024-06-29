import _ from 'lodash';
import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: false });

const chatId = process.env.TG_GROUP_ID;

export const sendMessageToTG = _.debounce((text: string) => {
    bot.sendMessage(chatId, text).catch((error) => console.log('ОШИБКА ЕБАННОГО БОТА', error));
}, 300);

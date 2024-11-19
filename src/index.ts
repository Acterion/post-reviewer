import { Telegraf } from 'telegraf';

import { about } from './commands';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { development, production } from './core';
import { handleMessage } from './gptChat/message';
import { printHistory } from './commands/printHistory';

export const config = {
  runtime: 'edge',
};

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ENVIRONMENT = process.env.NODE_ENV || '';

const bot = new Telegraf(BOT_TOKEN);

bot.command('about', about());
bot.command('printHistory', printHistory());
// bot.on('message', (ctx) =>
//   ctx.persistentChatAction('typing', async () => {
//     await handleMessage()(ctx);
//   }),
// );

bot.on('message', handleMessage());

//prod mode (Vercel)
export const startVercel = async (req: VercelRequest, res: VercelResponse) => {
  await production(req, res, bot);
};
//dev mode
ENVIRONMENT !== 'production' && development(bot);

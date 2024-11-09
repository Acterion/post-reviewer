import { Context } from 'telegraf';
import { drop } from '../gptChat/history';
import createDebug from 'debug';

const debug = createDebug('bot:about_command');

export const dropHistory = () => async (ctx: Context) => {
  drop();
  debug('History dropped');
  ctx.reply('History dropped');
};

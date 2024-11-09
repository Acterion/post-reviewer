import { Context } from 'telegraf';
import { print } from '../gptChat/history';
import createDebug from 'debug';

export const printHistory = () => async (ctx: Context) => {
  const debug = createDebug('bot:printHistory_command');
  debug('Triggered "printHistory" command');
  ctx.reply(JSON.stringify(print()));
};

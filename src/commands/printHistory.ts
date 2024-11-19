import { Context } from 'telegraf';
import createDebug from 'debug';
import { supabase } from '../utils/supabase';

const debug = createDebug('bot:printHistory_command');
export const printHistory = () => async (ctx: Context) => {
  debug('Triggered "printHistory" command');
  const { data: history } = await supabase
    .from('history')
    .select('role, content');
  ctx.replyWithMarkdownV2(
    history?.length
      ? history.reduce((acc, { role, content }) => {
          const escapedContent = content.replace(
            /([-.*+?!^${}()|[\]\\])/g,
            '\\$1',
          );
          return (acc += `*${role}*: ${escapedContent}\n`);
        }, '')
      : 'No history',
  );
};

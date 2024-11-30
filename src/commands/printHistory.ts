import { Context } from 'telegraf';
import createDebug from 'debug';
import { supabase } from '../utils/supabase';

const debug = createDebug('bot:printHistory_command');
export const printHistory = () => async (ctx: Context) => {
  debug('Triggered "printHistory" command');
  const { data: history } = await supabase
    .from('history')
    .select('role, content')
    .order('created_at', { ascending: true });
  const reply = history?.length
    ? history.reduce((acc, { role, content }) => {
        const escapedContent = content.replace(
          /([-.*+?!^${}()|[\]\\])/g,
          '\\$1',
        );
        return (acc += `*${role}*: ${escapedContent}\n`);
      }, '')
    : 'No history';
  if (reply.length > 4096) {
    const parts = reply.match(/\\\\?[\s\S]{1,4096}/g);
    parts?.forEach((part) => ctx.replyWithMarkdownV2(part));
  } else ctx.replyWithMarkdownV2(reply);
};

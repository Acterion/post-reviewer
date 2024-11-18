import { Context } from 'telegraf';
import { openai } from './openai';
import createDebug from 'debug';
import { checkUser } from '../db/checkUser';
import { updateHistory } from '../db/updateHistory';
import { fetchHistory } from '../db/fetchHistory';

const debug = createDebug('bot:handelMessage');

export const handleMessage = () => async (ctx: Context) => {
  debug('Triggered "handleMessage" command', ctx.from?.id, ctx.from?.username);
  await checkUser(ctx.from?.id || null, ctx.from?.username || '');
  const user_id = ctx.from?.id || null;
  const history = await fetchHistory(ctx.from?.id || null);
  if (ctx.message && ctx.text) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
        { role: 'user', content: ctx.text },
      ],
    });
    const msg = response.choices[0].message.content;
    if (!msg) {
      debug('No message from GPT-4o');
      return;
    }

    await updateHistory(user_id, 'user', ctx.text);
    await updateHistory(user_id, 'assistant', msg);

    ctx.reply(`🤖 ${msg}`);
  }
};

import { Context } from 'telegraf';
import { history } from './history';
import { openai } from './openai';
import createDebug from 'debug';

const debug = createDebug('bot:about_command');

export const handleMessage = () => async (ctx: Context) => {
  if (ctx.message && ctx.text) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: ctx.text },
      ],
    });
    const msg = response.choices[0].message.content;
    if (!msg) {
      debug('No message from GPT-4o');
      return;
    }

    history.push({ role: 'user', content: ctx.text });
    history.push({
      role: 'assistant',
      content: msg,
    });

    ctx.reply(`🤖 ${msg}`);
  }
};

import { Context } from 'telegraf';
import { openai } from './openai';
import createDebug from 'debug';
import { checkUser } from '../db/checkUser';
import { updateHistory } from '../db/updateHistory';
import { fetchHistory } from '../db/fetchHistory';
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources';
import { generateImage } from './image';

const debug = createDebug('bot:handelMessage');

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'generateImage',
      description:
        "Generates an image based on user-provided text using OpenAI's DALL-E model.",
      strict: true,
      parameters: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: {
            type: 'string',
            description: 'Text prompt to describe what the image should depict',
          },
        },
        additionalProperties: false,
      },
    },
  },
];

export const handleMessage = () => async (ctx: Context) => {
  debug('Triggered "handleMessage" command', ctx.from?.id, ctx.from?.username);
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: 'You are a helpful assistant.' },
  ];

  await checkUser(ctx.from?.id || null, ctx.from?.username || '');
  const user_id = ctx.from?.id || null;

  const history = await fetchHistory(ctx.from?.id || null);
  messages.push(...history);

  if (ctx.message && ctx.text) {
    messages.push({ role: 'user', content: ctx.text });
    let response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      tools,
    });

    if (response.choices[0].finish_reason === 'tool_calls') {
      messages.push(response.choices[0].message);

      const toolCall = response.choices[0].message.tool_calls![0];
      const toolName = toolCall.function.name;
      const params = JSON.parse(toolCall.function.arguments);

      if (toolName === 'generateImage') {
        const image_url = await generateImage(user_id, params.prompt);
        if (image_url) {
          // ctx.replyWithPhoto(image_url);
          messages.push({
            role: 'tool',
            content: `Generated image: ${image_url}`,
            tool_call_id: toolCall.id,
          });
          response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages,
          });
        }
      } else {
        messages.push({
          role: 'tool',
          content: 'Unknown tool call',
          tool_call_id: toolCall.id,
        });
      }
      debug('Tool call:', toolName, params);
    }
    const msg = response.choices[0].message.content;
    if (!msg) {
      debug('No message from GPT-4o');
      return;
    }

    await updateHistory(user_id, 'user', ctx.text);
    await updateHistory(user_id, 'assistant', msg);

    ctx.replyWithMarkdownV2(
      `🤖 ${msg}`.replace(/([-.*+?!^${}()|[\]\\])/g, '\\$1'),
    );
  }
};

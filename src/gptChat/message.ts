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
import { performWebSearch } from './search';

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
  {
    type: 'function',
    function: {
      name: 'webSearch',
      description:
        'Performs a web search and returns the top results. Use this when you need to find information from the internet.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query string',
          },
        },
        required: ['query'],
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
      model: 'gpt-4',
      messages,
      tools,
    });

    let tool_calls = response.choices[0].message.tool_calls;
    if (!!tool_calls) {
      messages.push(structuredClone(response.choices[0].message));
      while (tool_calls.length > 0) {
        const toolCall = tool_calls.pop()!;
        const toolName = toolCall.function.name;
        const params = JSON.parse(toolCall.function.arguments);

        debug('Tool call:', toolName, params);

        let toolResponseContent = '';

        switch (toolName) {
          case 'generateImage':
            const image_url = await generateImage(user_id, params.prompt);
            toolResponseContent = image_url || 'Failed to generate image.';
            break;

          case 'webSearch':
            try {
              const searchResults = await performWebSearch(params.query);
              toolResponseContent = searchResults;
            } catch (error) {
              debug('Error performing web search:', error);
              toolResponseContent =
                'An error occurred while performing the web search.';
            }
            break;

          default:
            toolResponseContent = 'Unknown tool call';
            break;
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: toolResponseContent,
        });
      }
      response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages,
      });
    }

    const msg = response.choices[0].message.content;
    if (!msg) {
      debug('No message from GPT-4');
      return;
    }

    await updateHistory(user_id, 'user', ctx.text);
    await updateHistory(user_id, 'assistant', msg);

    ctx.replyWithMarkdownV2(
      `🤖 ${msg}`.replace(/([-.*+?!^${}()|[\]\\])/g, '\\$1'),
    );
  }
};

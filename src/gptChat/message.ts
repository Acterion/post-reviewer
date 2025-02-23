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
import { generateImage } from './tools/image';
import { performWebSearch } from './tools/search';
import { summariseHistory } from './tools/summariseHistory';

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
        required: ['prompt', 'aspect_ratio'],
        properties: {
          prompt: {
            type: 'string',
            description: 'Text prompt to describe what the image should depict',
          },
          aspect_ratio: {
            type: 'string',
            description: 'Aspect ratio of the generated image. 1:1 by default',
            enum: [
              '1:1',
              '4:5',
              '5:4',
              '16:9',
              '9:16',
              '3:4',
              '4:3',
              '2:3',
              '3:2',
              '21:9',
              '9:21',
            ],
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
  {
    type: 'function',
    function: {
      name: 'summariseHistory',
      description:
        'Summarises and resets the conversation history when the user requests to delete, summarise, or shorten history. The function summarises the conversation history focusing on facts about the user and preferred tone of conversation, then resets the history with the summary.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {},
        required: [],
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
      model: 'gpt-4o-2024-08-06',
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
            const image_url = await generateImage(
              user_id,
              params.prompt,
              params.aspect_ratio,
            );
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

          case 'summariseHistory':
            try {
              const result = await summariseHistory(user_id, history);
              toolResponseContent = result;
            } catch (error) {
              debug('Error summarizing history:', error);
              toolResponseContent =
                'An error occurred while summarizing the history.';
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
        model: 'gpt-4o-2024-08-06',
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

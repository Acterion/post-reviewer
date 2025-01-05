import { fetchHistory } from '../../db/fetchHistory';
import { updateHistory } from '../../db/updateHistory';
import { deleteHistory } from '../../db/deleteHistory'; // You'll need to create this function
import { openai } from '../openai';
import { ChatCompletionMessageParam } from 'openai/resources';

export async function summariseHistory(
  user_id: number | null,
  history: ChatCompletionMessageParam[],
): Promise<string> {
  if (!user_id) return 'No user ID provided.';
  if (history.length === 0) {
    history = await fetchHistory(user_id);
    if (history.length === 0) return 'No conversation history to summarize.';
  }

  // Prepare the prompt for summarization
  const summarizationPrompt: ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content:
        'You are a helpful assistant that summarizes conversation history, focusing on facts about the user and their preferred tone of conversation. Provide a concise summary. You will use the summary in the future to maintain a consistent tone of conversation.',
    },
    {
      role: 'user',
      content:
        'Please summarize the following conversation history, focusing on facts about me and my preferred tone of conversation.',
    },
  ];

  // Add the conversation history to the prompt
  summarizationPrompt.push(...history);

  // Use OpenAI's API to summarize the history
  const summarizationResponse = await openai.chat.completions.create({
    model: 'gpt-4o-2024-08-06',
    messages: summarizationPrompt,
    max_tokens: 1024,
  });

  const summary = summarizationResponse.choices[0].message?.content;

  if (!summary) {
    return 'Failed to generate a summary of the conversation history.';
  }

  // Delete the existing history from Supabase
  await deleteHistory(user_id);

  // Write the summary as a new history entry prefixed with "History Summary"
  await updateHistory(user_id, 'assistant', `History Summary: ${summary}`);

  return 'Your conversation history has been summarized and reset.';
}

export async function cli_summariseHistory(args: string[]): Promise<void> {
  const user_id = args[0];
  if (!user_id) {
    console.error('Please provide a user ID.');
    return;
  }
  await summariseHistory(parseInt(user_id, 10), []);
}

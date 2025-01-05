import { openai } from '../openai';
import createDebug from 'debug';
import { put } from '@vercel/blob';
import { v4 as uuid } from 'uuid';
import { replicate } from '../replicate';

const debug = createDebug('bot:image');
interface PredictionInput {
  steps: number;
  width: number;
  height: number;
  prompt: string;
  disable_safety_checker: boolean;
  aspect_ratio?:
    | '1:1'
    | '4:5'
    | '5:4'
    | '16:9'
    | '9:16'
    | '3:4'
    | '4:3'
    | '2:3'
    | '3:2'
    | '21:9'
    | '9:21';
}

export async function generateImage(
  user_id: number | null,
  prompt: string,
  aspect_ratio: PredictionInput['aspect_ratio'] = '1:1',
) {
  const input: PredictionInput = {
    steps: 25,
    prompt,
    width: 1024,
    height: 1024,
    disable_safety_checker: true,
    aspect_ratio,
  };
  const [output] = (await replicate.run('black-forest-labs/flux-schnell', {
    input,
  })) as unknown as { url: () => string }[];

  return await saveImage(user_id, output.url());
}

async function saveImage(user_id: number | null, url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch image');
  }
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await put(`${user_id}/${uuid()}.png`, buffer, {
    access: 'public',
  });

  debug('Image saved to blob storage:', result.url);
  return result.url;
}

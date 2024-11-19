import { openai } from './openai';
import createDebug from 'debug';
import { put } from '@vercel/blob';
import { v4 as uuid } from 'uuid';
import { replicate } from './replicate';

const debug = createDebug('bot:image');
interface PredictionInput {
  steps: number;
  width: number;
  height: number;
  prompt: string;
  disable_safety_checker: boolean;
}

export async function generateImage(user_id: number | null, prompt: string) {
  //   const response = await openai.images.generate({
  //     prompt: text,
  //     model: 'dall-e-3',
  //     size: '1024x1024',
  //     quality: 'standard',
  //     n: 1,
  //   });
  //   const image_url = response.data[0].url;
  //   if (!image_url) {
  //     debug('No image from DALL-E-3');
  //     return null;
  //   }
  const input: PredictionInput = {
    steps: 25,
    prompt,
    width: 1024,
    height: 1024,
    disable_safety_checker: true,
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

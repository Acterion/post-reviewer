import { openai } from './openai';
import createDebug from 'debug';
import { put } from '@vercel/blob';
import { v4 as uuid } from 'uuid';

const debug = createDebug('bot:image');

export async function generateImage(user_id: number | null, text: string) {
  const response = await openai.images.generate({
    prompt: text,
    model: 'dall-e-3',
    size: '1024x1024',
    quality: 'standard',
    n: 1,
  });
  const image_url = response.data[0].url;
  if (!image_url) {
    debug('No image from DALL-E-3');
    return null;
  }
  return await saveImage(user_id, image_url);
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

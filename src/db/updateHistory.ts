import { supabase } from '../utils/supabase';

export const updateHistory = async (
  user_id: number | null,
  role: 'user' | 'assistant' | 'system',
  content: string,
) => {
  await supabase.from('history').insert([{ user_id, role, content }]);
};

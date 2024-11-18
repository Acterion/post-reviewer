import { supabase } from '../utils/supabase';
import createDebug from 'debug';

const debug = createDebug('bot:supabase');

export const checkUser = async (id: number | null, username: string) => {
  if (!id) return;
  const { data: user_id } = await supabase
    .from('users')
    .select('user_id')
    .eq('user_id', id);
  if (!user_id?.length) {
    await supabase.from('users').insert([{ user_id: id, username }]);
  }
};

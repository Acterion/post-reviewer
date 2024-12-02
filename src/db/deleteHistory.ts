import { supabase } from '../utils/supabase';

export async function deleteHistory(user_id: number | null) {
  if (!user_id) return;
  await supabase.from('history').delete().eq('user_id', user_id);
}

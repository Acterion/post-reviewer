import { supabase } from '../utils/supabase';

export async function fetchHistory(user_id: number | null) {
  if (!user_id) return [];
  const { data: history } = await supabase
    .from('history')
    .select('role, content')
    .eq('user_id', user_id);
  return history || [];
}

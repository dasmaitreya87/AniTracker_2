
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eghmkfmetkrulrfgtven.supabase.co';
const supabaseKey = 'sb_publishable_cMIau6g0OxwhgVSSL_wx6w_CvSJ8YuA';

export const supabase = createClient(supabaseUrl, supabaseKey);

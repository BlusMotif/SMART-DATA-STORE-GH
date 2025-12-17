import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jddstfppigucldetsxws.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkZHN0ZnBwaWd1Y2xkZXRzeHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4MTQ1MDUsImV4cCI6MjA4MTM5MDUwNX0.MwvCy45DluqdocUkkEhZ3QoGsQfYC30XGzbILT_JGgk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
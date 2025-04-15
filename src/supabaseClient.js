import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vehplmtzgsfhlmqaocoz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaHBsbXR6Z3NmaGxtcWFvY296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjM1NzgsImV4cCI6MjA2MDIzOTU3OH0.RXyhbeOH24fA_2GbXzz5FHLtq9XPpvMDr3Q4-M4lCwg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
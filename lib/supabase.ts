import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zsapmeezwbjsqtdjiqaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzYXBtZWV6d2Jqc3F0ZGppcWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDE5OTcsImV4cCI6MjA4MTcxNzk5N30.vL1KpUP74M78bOn8oirExQ4KolEMPfryqZQBt7JI2P4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
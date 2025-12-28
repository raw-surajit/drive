const { createClient } = require('@supabase/supabase-js');


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;


const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Key Length:", process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : "EMPTY");

module.exports = supabase;
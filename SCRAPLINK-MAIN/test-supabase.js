// test-supabase.js
// Node test for Supabase connectivity. Usage: node test-supabase.js
const { createClient } = require('@supabase/supabase-js');
const url = 'https://mjtvmzzlafbzzzmagzlp.supabase.co';
const key = process.env.SUPABASE_ANON_KEY || '';
if (!key) {
  console.error('Set SUPABASE_ANON_KEY env var before running this test.');
  process.exit(1);
}
const supabase = createClient(url, key);
(async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('auth.getSession:', { data, error });

    // Try fetching posts via PostgREST
    const { data: posts, error: postsErr } = await supabase.from('posts').select('*').limit(5).order('created_at', { ascending: false });
    console.log('posts:', { posts, postsErr });
  } catch (e) {
    console.error('Error', e);
  }
})();

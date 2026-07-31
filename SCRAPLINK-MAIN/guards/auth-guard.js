// guards/auth-guard.js
// Lightweight client-side auth guard. Import this module on pages that should be protected.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';
import { initSupabase } from '../supabase.js';
import { getUser } from '../auth.js';

(async function guard(){
  try {
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      try { initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY); } catch(e){ console.warn('Supabase init failed in guard', e); }
    }

    // Allowlist pages that should be reachable when signed out
    const allowPages = ['index.html', '', 'login.html', 'signup.html'];
    const path = location.pathname.split('/').pop();
    const page = path || 'index.html';

    let user = null;
    try {
      const r = await getUser();
      user = r?.data?.user || null;
    } catch (e) {
      console.warn('getUser failed in guard', e);
    }

    if (!user && !allowPages.includes(page)) {
      // remember where the user wanted to go
      try { sessionStorage.setItem('redirectAfterLogin', location.pathname + location.search); } catch(e){}
      location.replace('index.html');
    }
  } catch (e) {
    console.error('Auth guard error', e);
  }
})();

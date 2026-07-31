// auth.js
// Small authentication helpers that wrap Supabase auth client.
// Usage:
// 1) Ensure Supabase is initialized first (call initSupabase from supabase.js)
//    e.g. import { initSupabase } from './supabase.js'; initSupabase(URL, ANON_KEY);
// 2) Import helpers:
//    import { signUp, signIn, signOut, getUser, onAuthChange } from './auth.js';

import { supabaseClient } from './supabase.js';

function client() {
  try {
    return supabaseClient();
  } catch (err) {
    throw new Error('Supabase not initialized. Call initSupabase(url, anonKey) before using auth helpers.');
  }
}

export async function signUp(email, password, metadata = null) {
  if (!email || !password) throw new Error('email and password required');
  const c = client();
  // supabase-js (v2) uses auth.signUp; allow passing user metadata (e.g., full_name)
  if (metadata && typeof metadata === 'object') {
    return await c.auth.signUp({ email, password, options: { data: metadata } });
  }
  // fallback
  const res = await c.auth.signUp({ email, password });
  return res;
}

export async function signIn(email, password) {
  if (!email || !password) throw new Error('email and password required');
  const c = client();
  // Use signInWithPassword for recent clients
  if (c.auth && c.auth.signInWithPassword) {
    return await c.auth.signInWithPassword({ email, password });
  }
  return await c.auth.signIn({ email, password });
}

export async function signOut() {
  const c = client();
  return await c.auth.signOut();
}

export async function getUser() {
  const c = client();
  // returns { data: { user }, error }
  if (c.auth.getUser) return await c.auth.getUser();
  // fallback to session
  const { data } = await c.auth.getSession();
  return { data: { user: data?.session?.user || null }, error: null };
}

export async function getSession() {
  const c = client();
  if (c.auth.getSession) return await c.auth.getSession();
  // older clients
  return { data: { session: null }, error: null };
}

// onAuthChange registers a listener and returns a function to unsubscribe
export function onAuthChange(callback) {
  const c = client();
  const { data: listener } = c.auth.onAuthStateChange((event, session) => {
    try { callback(event, session); } catch (e) { console.error(e); }
  });
  // return unsubscribe helper
  return () => {
    if (listener && listener.subscription && listener.subscription.unsubscribe) {
      listener.subscription.unsubscribe();
    } else if (listener && typeof listener === 'function') {
      // older API
      listener();
    }
  };
}

// Convenience: get current user id
export async function getUserId() {
  const r = await getUser();
  return r?.data?.user?.id || null;
}

// Convenience: require authenticated user or throw
export async function requireUser() {
  const r = await getUser();
  const user = r?.data?.user;
  if (!user) throw new Error('Not authenticated');
  return user;
}

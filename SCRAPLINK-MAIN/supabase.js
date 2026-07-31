// supabase.js
// Small wrapper to initialize and use Supabase from browser pages as an ES module.
// Usage:
// 1) Include in your HTML as a module:
//    <script type="module">
//      import { initSupabase, uploadProfileImage, getPublicUrl } from './supabase.js';
//      initSupabase('https://your-project.supabase.co', 'PUBLIC_ANON_KEY');
//    </script>
// 2) Upload image: await uploadProfileImage(fileOrDataUrl, 'users/UID/profile.png')
// 3) Get public URL: getPublicUrl('users/UID/profile.png')

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

let supabase = null;

// default bucket and posts table names — you can override when calling helpers
// Use the user's created bucket named 'avatars'
const DEFAULT_BUCKET = 'avatars';
const DEFAULT_POSTS_TABLE = 'posts';

export function initSupabase(supabaseUrl, supabaseAnonKey) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('initSupabase requires supabaseUrl and supabaseAnonKey');
  }
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
}

function ensureClient() {
  if (!supabase) throw new Error('Supabase not initialized. Call initSupabase(url, anonKey) first.');
  return supabase;
}

// Convert data URL (base64) to a Blob
function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

// Generic upload helper: uploads a File/Blob or data URL to the given bucket and path.
export async function uploadFile(fileOrDataUrl, path = 'file.png', bucket = DEFAULT_BUCKET) {
  const client = ensureClient();
  let fileToUpload = fileOrDataUrl;
  if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
    fileToUpload = dataUrlToBlob(fileOrDataUrl);
  }
  const { data, error } = await client.storage.from(bucket).upload(path, fileToUpload, { upsert: true });
  return { data, error };
}

// Get a public URL for a file in a bucket (bucket defaults to DEFAULT_BUCKET).
export function getPublicUrl(path, bucket = DEFAULT_BUCKET) {
  const client = ensureClient();
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}

// Get a signed URL for a private bucket (expiresIn seconds)
export async function getSignedUrl(path, expiresIn = 60, bucket = DEFAULT_BUCKET) {
  const client = ensureClient();
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresIn);
  return { url: data?.signedUrl || null, error };
}

// Remove a file
export async function removeFile(path, bucket = DEFAULT_BUCKET) {
  const client = ensureClient();
  const { data, error } = await client.storage.from(bucket).remove([path]);
  return { data, error };
}

// Backwards-compatible profile upload helper
export async function uploadProfileImage(fileOrDataUrl, path = 'profile.png') {
  return uploadFile(fileOrDataUrl, path, DEFAULT_BUCKET);
}

export async function saveProfileAndReturnUrl(fileOrDataUrl, path = 'users/profile.png') {
  const upload = await uploadProfileImage(fileOrDataUrl, path);
  if (upload.error) return { url: null, error: upload.error };
  const url = getPublicUrl(path);
  return { url, error: null };
}

// Posts table helpers
// insert a post record into the configured posts table. Expected post shape:
// { image_url, description, type, location, amount, uploader, metadata }
export async function insertPost(post, table = DEFAULT_POSTS_TABLE) {
  const client = ensureClient();
  const payload = Object.assign({}, post, { created_at: post.created_at || new Date().toISOString() });
  const { data, error } = await client.from(table).insert([payload]);
  return { data, error };
}

// Fetch posts from posts table. options: { limit, order }
export async function fetchPosts({ limit = 50, order = 'desc', table = DEFAULT_POSTS_TABLE } = {}) {
  const client = ensureClient();
  const { data, error } = await client.from(table).select('*').order('created_at', { ascending: order === 'asc' }).limit(limit);
  return { data, error };
}

// Profile helpers
export async function getProfile(userId) {
  const client = ensureClient();
  if (!userId) return { data: null, error: new Error('userId required') };
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  return { data, error };
}

// Upsert profile row (client must be authenticated or RLS must allow it).
export async function upsertProfile(profile) {
  const client = ensureClient();
  if (!profile || !profile.id) return { data: null, error: new Error('profile with id required') };
  const { data, error } = await client.from('profiles').upsert([profile], { returning: 'representation' });
  return { data, error };
}

// Export raw client getter for advanced uses
export function supabaseClient() {
  return ensureClient();
}


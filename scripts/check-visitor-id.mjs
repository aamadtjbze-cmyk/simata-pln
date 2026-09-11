// Cek: Form ID dari sequence tidak kembar walau diminta bersamaan, dan INSERT
// ke ID yang sudah ada ditolak (bukan menimpa tamu lain).
// Jalankan: node --env-file=.env.local scripts/check-visitor-id.mjs
// Catatan: setiap jalan memakai 10 nomor sequence (Form ID melompat 10).
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const ids = await Promise.all(Array.from({ length: 10 }, () => db.rpc('next_visitor_id')));
ids.forEach((r) => assert.ifError(r.error));
const values = ids.map((r) => r.data);
assert.equal(new Set(values).size, values.length, `ID kembar: ${values}`);
values.forEach((v) => assert.match(v, /^TJB-VST-\d{6}$/));

const { data: existing } = await db.from('visitors').select('id, visitor_name').limit(1).single();
const { error } = await db.from('visitors').insert({ ...existing, visitor_name: 'UJI TIMPA', company: 'X', visited: 'X', purpose: 'X', schedule: 'X' });
assert.equal(error?.code, '23505', 'INSERT ke ID yang sudah ada seharusnya ditolak');
const { data: after } = await db.from('visitors').select('visitor_name').eq('id', existing.id).single();
assert.equal(after.visitor_name, existing.visitor_name, 'data tamu lama tertimpa!');

console.log('OK:', values[0], '…', values.at(-1), '| INSERT bentrok ditolak, data lama utuh');

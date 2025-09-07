// lib/repos/backup.ts
'use client';

const KEYS = ['cm_profiles_v1', 'cm_recipes_v1', 'cm_entries_v1', 'cm_targets_v1'] as const;
type Key = typeof KEYS[number];

export type BackupBundle = {
  version: 1;
  exported_at_ms: number;
  data: Record<Key, any>;
};

function read(k: Key) {
  try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch { return null; }
}
function write(k: Key, v: any) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

export async function exportAll(): Promise<BackupBundle> {
  const data: Record<Key, any> = {
    cm_profiles_v1: read('cm_profiles_v1'),
    cm_recipes_v1: read('cm_recipes_v1'),
    cm_entries_v1: read('cm_entries_v1'),
    cm_targets_v1: read('cm_targets_v1'),
  };
  return { version: 1, exported_at_ms: Date.now(), data };
}

export async function importAll(bundle: BackupBundle, { replace = true } = {}) {
  if (!bundle || bundle.version !== 1) throw new Error('Unsupported backup file');
  if (replace) {
    for (const k of KEYS) write(k, bundle.data[k] ?? null);
  } else {
    // (Optional) merge mode — for now we keep it simple
    for (const k of KEYS) write(k, bundle.data[k] ?? null);
  }
}

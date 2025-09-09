'use client';

import React from 'react';
import AddRiceGrain, { AddPayload } from '@/components/AddRiceGrain';

declare global {
  interface Window {
    addDiaryEntry?: (p: AddPayload) => void;
  }
}

export default function RiceGrainsPicker() {
  function handleAdd(p: AddPayload) {
    // 1) If your app exposes a global add function, use it
    if (typeof window !== 'undefined' && typeof window.addDiaryEntry === 'function') {
      try {
        window.addDiaryEntry(p);
        return;
      } catch (e) {
        console.error('addDiaryEntry failed:', e);
      }
    }

    // 2) Emit a CustomEvent your app can listen to
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent<AddPayload>('diary:add', { detail: p }));
    }

    // 3) Always log so you can verify payload shape during wiring
    console.info('DIARY_ADD (event emitted)', p);
  }

  return <AddRiceGrain onAdd={handleAdd} />;
}

import React from 'react';

export type CatKey =
  | 'All'
  | 'Grains>Rice'
  | 'Grains>Flavoured Rice'
  | 'Grains>Fried Rice'
  | 'Grains>Biryani/Pulao (Rice Only)'
  | 'Grains>Regional Rice'
  | 'Grains>Batter';

const CATS: CatKey[] = [
  'All',
  'Grains>Rice',
  'Grains>Flavoured Rice',
  'Grains>Fried Rice',
  'Grains>Biryani/Pulao (Rice Only)',
  'Grains>Regional Rice',
  'Grains>Batter',
];

export default function CategoryChips({
  value,
  onChange,
}: {
  value: CatKey;
  onChange: (v: CatKey) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '10px 0' }}>
      {CATS.map(c => {
        const active = value === c;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            style={{
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid #ddd',
              background: active ? '#111' : '#fff',
              color: active ? '#fff' : '#333',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {c === 'All' ? 'All' : c.split('>').slice(-1)[0]}
          </button>
        );
      })}
    </div>
  );
}

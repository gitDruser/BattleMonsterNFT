'use client';

import { MintMonsters } from '@/components/MintMonsters';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0f1623] text-white">
      <div className="max-w-6xl mx-auto p-4">
        <MintMonsters />
      </div>
    </main>
  );
}

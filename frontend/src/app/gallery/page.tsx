'use client';

import { useAccount, useReadContract } from 'wagmi';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '@/config/contracts';
import { useEffect, useState } from 'react';

function MonsterCard({ id }: { id: bigint }) {
  const { data: breedingInfo } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getBreedingInfo',
    args: [id],
  });

  const { data: monsterStats } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getMonster',
    args: [id],
  });

  if (!monsterStats || !breedingInfo) {
    return (
      <div className="bg-[#1a1f2e] rounded-lg p-6">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // breedingInfo returns:
  // [0] canBreed - bool
  // [1] isGenesis - bool
  // [2] hasBreedBefore - bool
  // [3] cooldownEnd - uint256
  // [4] parent1Id - uint256
  // [5] parent2Id - uint256

  const isGenesis = breedingInfo[1];
  const hasBreedBefore = breedingInfo[2];

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Monster #{id.toString()}</h3>
        <div className="flex gap-2">
          {isGenesis ? (
            <>
              <span className="px-2 py-1 bg-purple-500 text-xs rounded-full">Genesis</span>
              {hasBreedBefore && (
                <span className="px-2 py-1 bg-yellow-500 text-xs rounded-full">Has Bred</span>
              )}
            </>
          ) : (
            <span className="px-2 py-1 bg-blue-500 text-xs rounded-full">Bred</span>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-red-500">⚔️</span>
          <span className="text-gray-400">Attack:</span>
          <span className="font-medium">{Number(monsterStats[2])}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-500">🛡️</span>
          <span className="text-gray-400">Defense:</span>
          <span className="font-medium">{Number(monsterStats[3])}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-green-500">⚡</span>
          <span className="text-gray-400">Speed:</span>
          <span className="font-medium">{Number(monsterStats[4])}</span>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: userMonsters } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getTokensOfOwner',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#0f1623] text-white">
        <div className="max-w-6xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-8">Your Monster Collection</h1>
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f1623] text-white">
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-8">Your Monster Collection</h1>
        
        {!address ? (
          <p className="text-gray-400">Connect your wallet to view your monsters</p>
        ) : !userMonsters?.length ? (
          <p className="text-gray-400">You don't have any monsters yet. Mint some to get started!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userMonsters.map((id) => (
              <MonsterCard key={id.toString()} id={id} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 
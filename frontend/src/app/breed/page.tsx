'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '@/config/contracts';

export default function BreedPage() {
  const [parent1Id, setParent1Id] = useState<string>('');
  const [parent2Id, setParent2Id] = useState<string>('');
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  const { data: userMonsters } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getTokensOfOwner',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: parent1Stats } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getMonster',
    args: parent1Id ? [BigInt(parent1Id)] : undefined,
    query: {
      enabled: !!parent1Id,
    },
  });

  const { data: parent2Stats } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getMonster',
    args: parent2Id ? [BigInt(parent2Id)] : undefined,
    query: {
      enabled: !!parent2Id,
    },
  });

  const handleBreed = async () => {
    if (!address || !parent1Id || !parent2Id) return;

    if (!parent1Stats?.[0] || !parent2Stats?.[0]) {
      alert('Both parents must be Genesis NFTs to breed');
      return;
    }

    if (parent1Stats[5] || parent2Stats[5]) {
      alert('One or both monsters have already been used for breeding');
      return;
    }

    try {
      await writeContract({
        address: BATTLE_MONSTERS_ADDRESS,
        abi: BATTLE_MONSTERS_ABI,
        functionName: 'breedMonsters',
        args: [BigInt(parent1Id), BigInt(parent2Id)],
      });
    } catch (error) {
      console.error('Failed to breed monsters:', error);
    }
  };

  return (
    <main className="min-h-screen bg-[#0f1623] text-white">
      <div className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-8">Breed Monsters</h1>

        <div className="bg-[#1a1f2e] rounded-lg p-6 max-w-xl mx-auto">
          <div className="space-y-6">
            <div>
              <label className="block text-white mb-2">Select First Parent (Genesis Only)</label>
              <select
                value={parent1Id}
                onChange={(e) => setParent1Id(e.target.value)}
                className="w-full bg-[#2a3142] text-white p-2 rounded border border-gray-700"
              >
                <option value="">Select a monster</option>
                {userMonsters?.map((id) => (
                  <option key={id.toString()} value={id.toString()}>
                    Monster #{id.toString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white mb-2">Select Second Parent (Genesis Only)</label>
              <select
                value={parent2Id}
                onChange={(e) => setParent2Id(e.target.value)}
                className="w-full bg-[#2a3142] text-white p-2 rounded border border-gray-700"
              >
                <option value="">Select a monster</option>
                {userMonsters?.map((id) => (
                  <option key={id.toString()} value={id.toString()}>
                    Monster #{id.toString()}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleBreed}
              disabled={!address || !parent1Id || !parent2Id || parent1Id === parent2Id}
              className="w-full bg-[#7c3aed] text-white py-3 rounded font-medium hover:bg-[#6d28d9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Breed Monsters
            </button>

            <div className="mt-6 space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span className="text-yellow-400">Only Genesis NFTs can be used for breeding</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>Each monster can only breed once</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>24-hour cooldown period after breeding</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 
'use client';

import { useAccount, useReadContracts } from 'wagmi';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '../config/contracts';
import { useEffect, useState } from 'react';

interface Monster {
  attack: number;
  defense: number;
  speed: number;
  isGenesis: boolean;
  hasBreed: boolean;
  parent1Id: number;
  parent2Id: number;
  breedingCooldown: number;
}

export function MonsterGallery() {
  const { address } = useAccount();
  const [monsters, setMonsters] = useState<{ id: number; data: Monster }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: tokens } = useReadContracts({
    contracts: [
      {
        address: BATTLE_MONSTERS_ADDRESS,
        abi: BATTLE_MONSTERS_ABI,
        functionName: 'getTokensOfOwner',
        args: address ? [address] : undefined,
      }
    ]
  });

  const { data: monsterDetails } = useReadContracts({
    contracts: tokens?.[0]?.result ? 
      (tokens[0].result as readonly bigint[]).map((tokenId) => ({
        address: BATTLE_MONSTERS_ADDRESS,
        abi: BATTLE_MONSTERS_ABI,
        functionName: 'getMonster' as const,
        args: [tokenId],
      })) : [],
  });

  useEffect(() => {
    if (!address || !tokens?.[0]?.result || !monsterDetails) return;

    const tokenArray = tokens[0].result as readonly bigint[];
    const monsterData = [];

    try {
      for (let i = 0; i < tokenArray.length; i++) {
        const details = monsterDetails[i]?.result;
        if (!details) continue;

        const [attack, defense, speed, isGenesis, parent1Id, parent2Id, breedingCooldown] = details;

        const monster: Monster = {
          attack: Number(attack),
          defense: Number(defense),
          speed: Number(speed),
          isGenesis,
          hasBreed: Number(breedingCooldown) > 0,
          parent1Id: Number(parent1Id),
          parent2Id: Number(parent2Id),
          breedingCooldown: Number(breedingCooldown),
        };

        monsterData.push({ id: Number(tokenArray[i]), data: monster });
      }

      setMonsters(monsterData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing monster details:', error);
      setIsLoading(false);
    }
  }, [address, tokens, monsterDetails]);

  if (!address) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-400">
          Connect your wallet to view your monsters
        </h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4 text-gray-400">Loading your monsters...</p>
      </div>
    );
  }

  if (monsters.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-400 mb-4">
          You don't have any monsters yet
        </h2>
        <p className="text-gray-500">
          Head over to the Mint tab to create your first monster!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {monsters.map(({ id, data }) => (
        <div
          key={id}
          className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-purple-400">Monster #{id}</h3>
            <span className={`px-2 py-1 rounded text-sm ${
              data.isGenesis ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
            }`}>
              {data.isGenesis ? 'Genesis' : 'Bred'}
            </span>
          </div>

          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-red-400 text-sm font-medium">Attack</div>
                <div className="text-2xl font-bold">{data.attack}</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-blue-400 text-sm font-medium">Defense</div>
                <div className="text-2xl font-bold">{data.defense}</div>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                <div className="text-green-400 text-sm font-medium">Speed</div>
                <div className="text-2xl font-bold">{data.speed}</div>
              </div>
            </div>

            {/* Breeding Info */}
            {!data.isGenesis && (
              <div className="border-t border-gray-700/50 pt-4 mt-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Parents</h4>
                <div className="flex justify-between text-sm">
                  <span>Parent #1: {data.parent1Id}</span>
                  <span>Parent #2: {data.parent2Id}</span>
                </div>
              </div>
            )}

            {/* Breeding Status */}
            <div className="border-t border-gray-700/50 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Breeding Status</span>
                <span className={`text-sm ${
                  data.hasBreed ? 'text-gray-500' : 'text-green-400'
                }`}>
                  {data.hasBreed ? 'Already Bred' : 'Available for Breeding'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 
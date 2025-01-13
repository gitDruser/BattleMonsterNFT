'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { BATTLE_MONSTERS_ADDRESS, BATTLE_MONSTERS_ABI } from '@/config/contracts';

interface BreedingInfo {
  canBreed: boolean;
  isGenesis: boolean;
  hasBreedBefore: boolean;
  cooldownEnd: bigint;
  parent1Id: bigint;
  parent2Id: bigint;
}

export function BreedMonsters() {
  const { address } = useAccount();
  const [parent1Id, setParent1Id] = useState<string>('');
  const [parent2Id, setParent2Id] = useState<string>('');
  const [parent1Info, setParent1Info] = useState<BreedingInfo | null>(null);
  const [parent2Info, setParent2Info] = useState<BreedingInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Breeding Info
  const { data: parent1Data } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getBreedingInfo',
    args: parent1Id ? [BigInt(parent1Id)] : undefined,
    query: {
      enabled: Boolean(parent1Id)
    }
  });
  
  const { data: parent2Data } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getBreedingInfo',
    args: parent2Id ? [BigInt(parent2Id)] : undefined,
    query: {
      enabled: Boolean(parent2Id)
    }
  });

  useEffect(() => {
    if (parent1Data) {
      const [canBreed, isGenesis, hasBreedBefore, cooldownEnd, p1, p2] = parent1Data;
      setParent1Info({
        canBreed,
        isGenesis,
        hasBreedBefore,
        cooldownEnd,
        parent1Id: p1,
        parent2Id: p2
      });
    }
  }, [parent1Data]);

  useEffect(() => {
    if (parent2Data) {
      const [canBreed, isGenesis, hasBreedBefore, cooldownEnd, p1, p2] = parent2Data;
      setParent2Info({
        canBreed,
        isGenesis,
        hasBreedBefore,
        cooldownEnd,
        parent1Id: p1,
        parent2Id: p2
      });
    }
  }, [parent2Data]);

  const { writeContract } = useWriteContract();

  const validateBreeding = (): string | null => {
    if (!parent1Info || !parent2Info) return "Monster information not loaded";
    if (parent1Id === parent2Id) return "Cannot breed a monster with itself";
    if (!parent1Info.isGenesis) return "Parent 1 must be a Genesis monster";
    if (!parent2Info.isGenesis) return "Parent 2 must be a Genesis monster";
    if (parent1Info.hasBreedBefore) return "Parent 1 has already bred";
    if (parent2Info.hasBreedBefore) return "Parent 2 has already bred";
    
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (parent1Info.cooldownEnd > now) return "Parent 1 is still in cooldown";
    if (parent2Info.cooldownEnd > now) return "Parent 2 is still in cooldown";
    
    return null;
  };

  const handleBreed = async () => {
    setError(null);
    const validationError = validateBreeding();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsLoading(true);
    try {
      await writeContract({
        address: BATTLE_MONSTERS_ADDRESS,
        abi: BATTLE_MONSTERS_ABI,
        functionName: 'breedMonsters',
        args: [BigInt(parent1Id), BigInt(parent2Id)],
        gas: 300000,
      });

      setParent1Id('');
      setParent2Id('');
      setParent1Info(null);
      setParent2Info(null);
    } catch (error: any) {
      console.error('Failed to breed monsters:', error);
      // Log error 
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        data: error.data,
        cause: error.cause,
      });

      let errorMessage = "Failed to breed monsters";
      
      if (error.message) {
        if (error.message.includes("Not owner")) {
          errorMessage = "You must own both monsters to breed them";
        } else if (error.message.includes("Max bred monsters")) {
          errorMessage = "Maximum number of bred monsters reached";
        } else if (error.message.includes("Both parents must be Genesis")) {
          errorMessage = "Both parents must be Genesis monsters";
        } else if (error.message.includes("already bred")) {
          errorMessage = "One or both parents have already bred";
        } else if (error.message.includes("cooldown")) {
          errorMessage = "One or both parents are still in cooldown";
        } else if (error.message.includes("Cannot breed with self")) {
          errorMessage = "Cannot breed a monster with itself";
        } else {
          errorMessage = `Transaction failed: ${error.message}`;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const canBreed = parent1Info?.canBreed && parent2Info?.canBreed && parent1Id && parent2Id;

  const formatCooldown = (cooldownEnd: bigint) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    if (cooldownEnd <= now) return 'Ready';
    
    const remainingSeconds = Number(cooldownEnd - now);
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-primary">Breed Your Monsters</h2>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parent 1 Selection */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-300">Parent 1 ID</span>
            <input
              type="number"
              value={parent1Id}
              onChange={(e) => {
                setError(null);
                setParent1Id(e.target.value);
              }}
              className="mt-1 block w-full rounded-lg bg-dark/50 border border-gray-600 px-4 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Enter monster ID"
            />
          </label>
          {parent1Info && (
            <div className="text-sm text-gray-400">
              <p>Genesis Monster: {parent1Info.isGenesis ? 'Yes' : 'No'}</p>
              <p>Has Bred Before: {parent1Info.hasBreedBefore ? 'Yes' : 'No'}</p>
              <p>Cooldown: {formatCooldown(parent1Info.cooldownEnd)}</p>
              <p className={parent1Info.canBreed ? 'text-green-500' : 'text-red-500'}>
                Status: {parent1Info.canBreed ? 'Ready to breed' : 'Not available'}
              </p>
            </div>
          )}
        </div>

        {/* Parent 2 Selection */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-300">Parent 2 ID</span>
            <input
              type="number"
              value={parent2Id}
              onChange={(e) => {
                setError(null);
                setParent2Id(e.target.value);
              }}
              className="mt-1 block w-full rounded-lg bg-dark/50 border border-gray-600 px-4 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Enter monster ID"
            />
          </label>
          {parent2Info && (
            <div className="text-sm text-gray-400">
              <p>Genesis Monster: {parent2Info.isGenesis ? 'Yes' : 'No'}</p>
              <p>Has Bred Before: {parent2Info.hasBreedBefore ? 'Yes' : 'No'}</p>
              <p>Cooldown: {formatCooldown(parent2Info.cooldownEnd)}</p>
              <p className={parent2Info.canBreed ? 'text-green-500' : 'text-red-500'}>
                Status: {parent2Info.canBreed ? 'Ready to breed' : 'Not available'}
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={handleBreed}
        disabled={!canBreed || isLoading}
        className={`w-full py-3 px-4 rounded-lg font-medium ${
          canBreed
            ? 'bg-primary text-white hover:bg-primary/90'
            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Breeding...' : 'Breed Monsters'}
      </button>

      {!address && (
        <p className="text-center text-gray-400">
          Connect your wallet to start breeding monsters
        </p>
      )}
    </div>
  );
} 
'use client';

import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '@/config/contracts';
import { parseEther } from 'viem';

export function BattleChallenge() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [opponentAddress, setOpponentAddress] = useState('');
  const [selectedMonster, setSelectedMonster] = useState('');
  const [opponentMonster, setOpponentMonster] = useState('');
  const [stake, setStake] = useState('');
  const [isNFTStake, setIsNFTStake] = useState(false);

  // Get user's monsters
  const { data: userMonsters } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getTokensOfOwner',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const handleChallenge = async () => {
    if (!address || !opponentAddress || !selectedMonster || !opponentMonster) return;

    try {
      await writeContract({
        address: BATTLE_MONSTERS_ADDRESS,
        abi: BATTLE_MONSTERS_ABI,
        functionName: 'challengePlayer',
        args: [
          opponentAddress as `0x${string}`,
          BigInt(selectedMonster),
          BigInt(opponentMonster),
          isNFTStake,
        ],
        value: stake ? parseEther(stake) : BigInt(0),
      });
    } catch (error) {
      console.error('Failed to issue challenge:', error);
    }
  };

  if (!address) {
    return (
      <div className="bg-[#1a1f2e] rounded-lg p-6">
        <p className="text-gray-400">Connect your wallet to start a battle</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f2e] rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">Challenge a Player</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 mb-2">Opponent Address</label>
          <input
            type="text"
            value={opponentAddress}
            onChange={(e) => setOpponentAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-[#2a3142] text-white p-2 rounded border border-gray-700"
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Your Monster</label>
          <select
            value={selectedMonster}
            onChange={(e) => setSelectedMonster(e.target.value)}
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
          <label className="block text-gray-400 mb-2">Opponent's Monster</label>
          <input
            type="number"
            value={opponentMonster}
            onChange={(e) => setOpponentMonster(e.target.value)}
            placeholder="Monster ID"
            className="w-full bg-[#2a3142] text-white p-2 rounded border border-gray-700"
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-2">Stake Amount (ETH)</label>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            placeholder="0.0"
            step="0.01"
            disabled={isNFTStake}
            className="w-full bg-[#2a3142] text-white p-2 rounded border border-gray-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isNFTStake}
            onChange={(e) => {
              setIsNFTStake(e.target.checked);
              if (e.target.checked) setStake('');
            }}
            className="bg-[#2a3142] border border-gray-700 rounded"
          />
          <label className="text-gray-400">Stake NFTs (Winner takes both monsters)</label>
        </div>

        <button
          onClick={handleChallenge}
          disabled={!opponentAddress || !selectedMonster || !opponentMonster}
          className="w-full bg-purple-500 text-white py-2 rounded font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Issue Challenge
        </button>
      </div>
    </div>
  );
} 
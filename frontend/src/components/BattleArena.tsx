'use client';

import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '../config/contracts';
import { useEffect, useState } from 'react';
import { parseEther } from 'viem';
import { DirectChallenges } from './DirectChallenges';

interface BattleStatus {
  inBattle: boolean;
  opponent: `0x${string}`;
  myHP: number;
  opponentHP: number;
  myTurn: boolean;
  battleComplete: boolean;
  winner: `0x${string}`;
}

interface PendingChallenge {
  battleId: number;
  stake: bigint;
  isNFTStake: boolean;
  monsterID: number;
  opponentMonsterID: number;
  opponent: `0x${string}`;
}

export function BattleArena() {
  const { address } = useAccount();
  const [selectedMonster, setSelectedMonster] = useState<number>(0);
  const [opponentAddress, setOpponentAddress] = useState<`0x${string}`>('0x' as `0x${string}`);
  const [opponentMonster, setOpponentMonster] = useState<number>(0);
  const [stakeAmount, setStakeAmount] = useState('0');
  const [isNFTStake, setIsNFTStake] = useState(false);
  const [battleStatus, setBattleStatus] = useState<BattleStatus | null>(null);
  const [pendingOutgoingChallenge, setPendingOutgoingChallenge] = useState<PendingChallenge | null>(null);

  const { writeContract } = useWriteContract();

  // Get battle status
  const { data: status, refetch: refetchStatus } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: [
      {
        inputs: [],
        name: 'getMyBattleStatus',
        outputs: [
          { name: 'inBattle', type: 'bool' },
          { name: 'opponent', type: 'address' },
          { name: 'myHP', type: 'uint256' },
          { name: 'opponentHP', type: 'uint256' },
          { name: 'myTurn', type: 'bool' },
          { name: 'battleComplete', type: 'bool' },
          { name: 'winner', type: 'address' },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ] as const,
    functionName: 'getMyBattleStatus',
    account: address,
  });

  const { data: pendingChallenge, refetch: refetchPendingChallenge } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getMyPendingChallenge',
    args: [opponentAddress],
    query: {
      enabled: Boolean(address && opponentAddress),
    },
  });

  useEffect(() => {
    if (status) {
      const data = status as unknown as {
        inBattle: boolean;
        opponent: `0x${string}`;
        myHP: bigint;
        opponentHP: bigint;
        myTurn: boolean;
        battleComplete: boolean;
        winner: `0x${string}`;
      };

      setBattleStatus({
        inBattle: data.inBattle,
        opponent: data.opponent,
        myHP: Number(data.myHP),
        opponentHP: Number(data.opponentHP),
        myTurn: data.myTurn,
        battleComplete: data.battleComplete,
        winner: data.winner,
      });
    }
  }, [status]);

  useEffect(() => {
    if (pendingChallenge && opponentAddress) {
      const [battleId, stake, isNFTStake, monsterID, opponentMonsterID] = pendingChallenge as unknown as [bigint, bigint, boolean, bigint, bigint];
      
      if (Number(battleId) > 0) {
        setPendingOutgoingChallenge({
          battleId: Number(battleId),
          stake,
          isNFTStake,
          monsterID: Number(monsterID),
          opponentMonsterID: Number(opponentMonsterID),
          opponent: opponentAddress,
        });
      } else {
        setPendingOutgoingChallenge(null);
      }
    }
  }, [pendingChallenge, opponentAddress]);

  const initiateBattle = async () => {
    if (!address || !selectedMonster || !opponentAddress || !opponentMonster) return;

    try {
      await writeContract({
        address: BATTLE_MONSTERS_ADDRESS,
        abi: BATTLE_MONSTERS_ABI,
        functionName: 'challengePlayer',
        args: [opponentAddress, BigInt(selectedMonster), BigInt(opponentMonster), isNFTStake],
        value: parseEther(stakeAmount),
      });
      refetchStatus();
      refetchPendingChallenge();
    } catch (error) {
      console.error('Error initiating battle:', error);
    }
  };

  const cancelChallenge = async () => {
    if (!address || !pendingOutgoingChallenge) return;

    try {
      await writeContract({
        address: BATTLE_MONSTERS_ADDRESS,
        abi: BATTLE_MONSTERS_ABI,
        functionName: 'cancelChallenge',
        args: [pendingOutgoingChallenge.opponent],
      });
      refetchPendingChallenge();
    } catch (error) {
      console.error('Error canceling challenge:', error);
    }
  };

  const attack = async () => {
    if (!address || !battleStatus?.inBattle || !battleStatus.myTurn) return;

    try {
      await writeContract({
        address: BATTLE_MONSTERS_ADDRESS,
        abi: BATTLE_MONSTERS_ABI,
        functionName: 'attack',
      });
      refetchStatus();
    } catch (error) {
      console.error('Error attacking:', error);
    }
  };

  if (!address) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-400">
          Connect your wallet to enter the battle arena
        </h2>
      </div>
    );
  }

  if (battleStatus?.inBattle) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700/50">
          <h2 className="text-2xl font-bold text-purple-400 mb-6">Active Battle</h2>
          
          <div className="grid grid-cols-2 gap-8">
            {/* Your Stats */}
            <div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">Your Monster</h3>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  HP: {battleStatus.myHP}
                </div>
                {battleStatus.myTurn && (
                  <button
                    onClick={attack}
                    className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Attack!
                  </button>
                )}
              </div>
            </div>

            {/* Opponent Stats */}
            <div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">Opponent</h3>
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-400 mb-2">
                  HP: {battleStatus.opponentHP}
                </div>
                {!battleStatus.myTurn && (
                  <div className="text-gray-400 text-center py-2">
                    Waiting for opponent...
                  </div>
                )}
              </div>
            </div>
          </div>

          {battleStatus.battleComplete && (
            <div className="mt-8 text-center">
              <h3 className="text-2xl font-bold mb-2">
                {battleStatus.winner === address ? (
                  <span className="text-green-400">Victory!</span>
                ) : (
                  <span className="text-red-400">Defeat</span>
                )}
              </h3>
              <p className="text-gray-400">
                {battleStatus.winner === address
                  ? 'Congratulations! You won the battle!'
                  : 'Better luck next time!'}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Incoming Challenges */}
      <DirectChallenges />

      {/* Outgoing Challenge */}
      {pendingOutgoingChallenge && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700/50">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">Outgoing Challenge</h2>
            
            <div className="bg-gray-700/50 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">
                  Battle #{pendingOutgoingChallenge.battleId}
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  pendingOutgoingChallenge.isNFTStake
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}>
                  {pendingOutgoingChallenge.isNFTStake ? 'NFT Stake' : 'ETH Stake'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Your Monster</p>
                  <p className="text-white font-medium">#{pendingOutgoingChallenge.monsterID}</p>
                </div>
                <div>
                  <p className="text-gray-400">Opponent Monster</p>
                  <p className="text-white font-medium">#{pendingOutgoingChallenge.opponentMonsterID}</p>
                </div>
              </div>

              {!pendingOutgoingChallenge.isNFTStake && (
                <div>
                  <p className="text-gray-400 text-sm">Stake Amount</p>
                  <p className="text-white font-medium">
                    {Number(pendingOutgoingChallenge.stake) / 1e18} ETH
                  </p>
                </div>
              )}

              <button
                onClick={cancelChallenge}
                className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Cancel Challenge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start New Battle */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm border border-gray-700/50">
          <h2 className="text-2xl font-bold text-purple-400 mb-6">Start a Battle</h2>
          
          <div className="space-y-6">
            {/* Monster Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Your Monster
              </label>
              <input
                type="number"
                min="1"
                value={selectedMonster || ''}
                onChange={(e) => setSelectedMonster(Number(e.target.value))}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="Enter monster ID"
              />
            </div>

            {/* Opponent Address */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Opponent Address
              </label>
              <input
                type="text"
                value={opponentAddress}
                onChange={(e) => {
                  if (e.target.value.startsWith('0x')) {
                    setOpponentAddress(e.target.value as `0x${string}`);
                  }
                }}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="0x..."
              />
            </div>

            {/* Opponent Monster */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Opponent Monster ID
              </label>
              <input
                type="number"
                min="1"
                value={opponentMonster || ''}
                onChange={(e) => setOpponentMonster(Number(e.target.value))}
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                placeholder="Enter opponent's monster ID"
              />
            </div>

            {/* Stake Settings */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stake Amount (ETH)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="0.0"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="nftStake"
                  checked={isNFTStake}
                  onChange={(e) => setIsNFTStake(e.target.checked)}
                  className="w-4 h-4 text-purple-500 border-gray-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="nftStake" className="ml-2 text-sm text-gray-300">
                  Stake NFT (Winner takes both monsters)
                </label>
              </div>
            </div>

            <button
              onClick={initiateBattle}
              disabled={!selectedMonster || !opponentAddress || !opponentMonster}
              className={`w-full py-3 px-8 rounded-lg text-lg font-bold text-white transition-all
                ${
                  !selectedMonster || !opponentAddress || !opponentMonster
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
                }
              `}
            >
              Start Battle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
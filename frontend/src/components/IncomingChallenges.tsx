'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useReadContracts, useWriteContract } from 'wagmi';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '@/config/contracts';
import { parseEther } from 'viem';

interface Challenge {
  battleId: bigint;
  challenger: `0x${string}`;
  stake: bigint;
  isNFTStake: boolean;
  monsterID: bigint;
  opponentMonsterID: bigint;
}

interface BattleResult {
  status: 'success';
  result: readonly [
    challenger: `0x${string}`,
    opponent: `0x${string}`,
    challengerMonsterID: bigint,
    opponentMonsterID: bigint,
    stake: bigint,
    isNFTStake: boolean,
    lastActionTime: bigint,
    currentTurn: bigint,
    isActive: boolean,
    isCompleted: boolean
  ];
}

interface TokenOwnerResult {
  status: 'success' | 'failure';
  result?: `0x${string}`;
  error?: Error;
}

export function IncomingChallenges() {
  const { address } = useAccount();
  const [potentialChallengers, setPotentialChallengers] = useState<`0x${string}`[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();

  const { data: allTokens } = useReadContract({
    abi: BATTLE_MONSTERS_ABI,
    address: BATTLE_MONSTERS_ADDRESS,
    functionName: 'getAllTokens',
  });

  const { data: tokenOwners } = useReadContracts({
    contracts: allTokens?.map(tokenId => ({
      abi: BATTLE_MONSTERS_ABI,
      address: BATTLE_MONSTERS_ADDRESS,
      functionName: 'ownerOf',
      args: [tokenId],
    })) ?? [],
  });

  useEffect(() => {
    if (!tokenOwners || !address) return;

    try {
      const uniqueOwners = new Set<`0x${string}`>();
      
      (tokenOwners as TokenOwnerResult[]).forEach((result) => {
        if (result.status === 'success' && result.result) {
          uniqueOwners.add(result.result);
        }
      });

      uniqueOwners.delete(address);

      setPotentialChallengers(Array.from(uniqueOwners));
    } catch (err) {
      console.error('Error processing token owners:', err);
      setError('Error processing token owners');
    }
  }, [tokenOwners, address]);

  const { data: incomingChallenges } = useReadContract({
    abi: BATTLE_MONSTERS_ABI,
    address: BATTLE_MONSTERS_ADDRESS,
    functionName: 'getIncomingChallenges',
    args: potentialChallengers.length > 0 ? [[...potentialChallengers]] : undefined,
  });

  const { data: battleDetails } = useReadContracts({
    contracts: incomingChallenges?.[1]?.map((battleId) => ({
      abi: BATTLE_MONSTERS_ABI,
      address: BATTLE_MONSTERS_ADDRESS,
      functionName: 'getBattleInfo',
      args: [battleId],
    })) ?? [],
  });

  useEffect(() => {
    if (!incomingChallenges || !battleDetails) {
      setChallenges([]);
      return;
    }

    try {
      const [challengerAddresses, battleIds] = incomingChallenges;
      
      const processedChallenges = battleIds.map((battleId: bigint, index: number) => {
        const battle = battleDetails[index] as BattleResult;
        if (!battle || battle.status !== 'success') return null;

        const [
          challenger,
          opponent,
          challengerMonsterID,
          opponentMonsterID,
          stake,
          isNFTStake,
          lastActionTime,
          currentTurn,
          isActive,
          isCompleted
        ] = battle.result;

        if (isCompleted || !isActive) return null;

        return {
          battleId,
          challenger: challengerAddresses[index],
          stake,
          isNFTStake,
          monsterID: challengerMonsterID,
          opponentMonsterID,
        } as Challenge;
      }).filter((challenge): challenge is Challenge => challenge !== null);

      setChallenges(processedChallenges);
    } catch (err) {
      console.error('Error processing challenges:', err);
      setError('Error processing challenges');
    } finally {
      setLoading(false);
    }
  }, [incomingChallenges, battleDetails]);

  const acceptChallenge = async (challenger: `0x${string}`, stake: bigint, isNFTStake: boolean) => {
    try {
      setLoading(true);
      setError(null);

      await writeContractAsync({
        abi: BATTLE_MONSTERS_ABI,
        address: BATTLE_MONSTERS_ADDRESS,
        functionName: 'acceptChallenge',
        args: [challenger],
        value: isNFTStake ? BigInt(0) : stake,
      });
    } catch (err) {
      console.error('Error accepting challenge:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error accepting challenge');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-400">Connect your wallet to view challenges</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-400">Loading challenges...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl mb-4">Incoming Challenges</h2>
      {challenges.length === 0 ? (
        <p className="text-gray-400">No incoming challenges</p>
      ) : (
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div key={challenge.battleId.toString()} className="p-4 bg-gray-800 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <p>From: {challenge.challenger}</p>
                  <p>Monster: #{challenge.monsterID.toString()}</p>
                  <p>Stake: {challenge.isNFTStake ? 'NFT Stake' : `${Number(challenge.stake) / 1e18} ETH`}</p>
                </div>
                <button
                  onClick={() => acceptChallenge(challenge.challenger, challenge.stake, challenge.isNFTStake)}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Accept Challenge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
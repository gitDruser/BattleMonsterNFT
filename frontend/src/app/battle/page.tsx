'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '@/config/contracts';
import { BattleChallenge } from '@/components/BattleChallenge';

interface BattleStatus {
  inBattle: boolean;
  opponent: `0x${string}`;
  myHP: bigint;
  opponentHP: bigint;
  myTurn: boolean;
  battleComplete: boolean;
  winner: `0x${string}`;
}

function AcceptChallenge() {
  const [challengerAddress, setChallengerAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { writeContractAsync } = useWriteContract();

  // Get pending challenge details
  const { data: pendingChallenge } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getMyPendingChallenge',
    args: challengerAddress ? [challengerAddress as `0x${string}`] : undefined,
  });

  const handleAcceptChallenge = async () => {
    try {
      setError(null);
      if (!challengerAddress) {
        throw new Error('Please enter the challenger\'s address');
      }

      if (!pendingChallenge) {
        throw new Error('No pending challenge found from this address');
      }

      const [battleId, stake, isNFTStake] = pendingChallenge;
      
      if (battleId === BigInt(0)) {
        throw new Error('No pending challenge from this address');
      }

      await writeContractAsync({
        abi: BATTLE_MONSTERS_ABI,
        address: BATTLE_MONSTERS_ADDRESS,
        functionName: 'acceptChallenge',
        args: [challengerAddress as `0x${string}`],
        value: isNFTStake ? BigInt(0) : stake, 
      });
    } catch (err) {
      console.error('Error accepting challenge:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error accepting challenge');
      }
    }
  };

  const stakeAmount = pendingChallenge ? pendingChallenge[1] : BigInt(0);
  const isNFTStake = pendingChallenge ? pendingChallenge[2] : false;

  return (
    <div className="mb-8">
      <h2 className="text-xl mb-4">Accept Challenge</h2>
      <div className="p-4 bg-gray-800 rounded">
        <div className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Enter challenger's wallet address"
            value={challengerAddress}
            onChange={(e) => setChallengerAddress(e.target.value)}
            className="p-2 bg-gray-700 rounded text-white"
          />
          {stakeAmount > 0 && (
            <p className="text-yellow-400">
              Required stake: {isNFTStake ? 'NFT Stake' : `${Number(stakeAmount) / 1e18} ETH`}
            </p>
          )}
          <button
            onClick={handleAcceptChallenge}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Accept Challenge
          </button>
          {error && <p className="text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default function BattlePage() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: battleStatus } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getMyBattleStatus',
    query: {
      enabled: !!address,
    },
  }) as { data: BattleStatus | undefined };

  // Debug log
  useEffect(() => {
    if (battleStatus) {
      console.log('Battle Status:', battleStatus);
    }
  }, [battleStatus]);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#0f1623] text-white">
        <div className="max-w-6xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-8">Battle Arena</h1>
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Under Construction Banner */}
      <div className="mb-8 p-4 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h2 className="text-xl font-bold text-yellow-500">🚧 Under Construction 🚧</h2>
            <p className="text-yellow-400/80">The battle system is currently being developed and tested. Battles are currently only available through the contract directly. Bear with me—this was a wild ride! The source code is basically a collection of my attempts to battle it into working order.</p>
          </div>
        </div>
      </div>

      <main className="min-h-screen bg-[#0f1623] text-white">
        <div className="max-w-6xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-8">Battle Arena</h1>
          
          {/* Debug Info */}
          <div className="mb-8 p-4 bg-gray-800 rounded">
            <h2 className="text-xl mb-4">Debug Info</h2>
            <p>Connected Address: {address || 'Not connected'}</p>
            <p>In Battle: {battleStatus?.inBattle ? 'Yes' : 'No'}</p>
            <pre className="mt-2 p-2 bg-gray-900 rounded">
              {JSON.stringify(battleStatus, (key, value) => 
                typeof value === 'bigint' ? value.toString() : value
              , 2)}
            </pre>
          </div>

          {/* Battle Interface */}
          {battleStatus?.inBattle ? (
            <div className="mb-8">
              <h2 className="text-xl mb-4">Active Battle</h2>
              <div className="p-4 bg-gray-800 rounded">
                <p>Opponent: {battleStatus.opponent}</p>
                <div className="mt-4 space-y-2">
                  <p>Your HP: {battleStatus.myHP.toString()}</p>
                  <p>Opponent HP: {battleStatus.opponentHP.toString()}</p>
                  <p>{battleStatus.myTurn ? "It's your turn!" : "Waiting for opponent..."}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-xl mb-4">Challenge Form</h2>
                <BattleChallenge />
              </div>
              <AcceptChallenge />
            </>
          )}
        </div>
      </main>
    </div>
  );
} 
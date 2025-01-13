'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '../config/contracts';
import { parseEther } from 'viem';

export function DirectChallenges() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengerAddress, setChallengerAddress] = useState('');

  const { data: pendingChallenge, refetch: refetchPending } = useReadContract({
    abi: BATTLE_MONSTERS_ABI,
    address: BATTLE_MONSTERS_ADDRESS,
    functionName: 'getMyPendingChallenge',
    args: [challengerAddress as `0x${string}`],
    query: {
      enabled: Boolean(challengerAddress && challengerAddress.length === 42),
    },
  });

  const acceptChallenge = async (challenger: string) => {
    if (!challenger) {
      setError('Please enter the challenger\'s address');
      return;
    }

    if (!challenger.startsWith('0x') || challenger.length !== 42) {
      setError('Please enter a valid Ethereum address');
      return;
    }

    try {
      console.log('Checking pending challenge from:', challenger);
      await refetchPending();
      console.log('Pending challenge data:', pendingChallenge);

      if (!pendingChallenge) {
        setError('No pending challenge found');
        return;
      }

      const [battleId, stake, isNFTStake] = pendingChallenge;
      console.log('Challenge details:', {
        battleId: battleId.toString(),
        stake: stake.toString(),
        isNFTStake
      });

      console.log('Accepting challenge from:', challenger);
      setLoading(true);
      setError(null);

      const tx = await writeContractAsync({
        abi: BATTLE_MONSTERS_ABI,
        address: BATTLE_MONSTERS_ADDRESS,
        functionName: 'acceptChallenge',
        args: [challenger as `0x${string}`],
        value: isNFTStake ? BigInt(0) : stake,
      });
      
      console.log('Challenge accepted successfully:', tx);
      setError(null);
      setChallengerAddress('');
    } catch (err) {
      console.error('Error accepting challenge:', err);
      if (err instanceof Error) {
        if (err.message.includes('insufficient funds')) {
          setError('Insufficient funds to accept the challenge. Please ensure you have enough ETH.');
        } else if (err.message.includes('user rejected')) {
          setError('Transaction was rejected. Please try again.');
        } else if (err.message.includes('No pending challenge')) {
          setError('No pending challenge from this address.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Error accepting challenge');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return (
      <div className="text-gray-400">Connect your wallet to accept challenges</div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Accept Challenge</h3>
      
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 mb-2">Challenger's Address</label>
          <input
            type="text"
            value={challengerAddress}
            onChange={(e) => setChallengerAddress(e.target.value)}
            placeholder="0x..."
            className="w-full bg-[#2a3142] text-white p-2 rounded border border-gray-700"
          />
        </div>

        {pendingChallenge && (
          <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
            <p>Found pending challenge!</p>
            <p>Stake: {!pendingChallenge[2] ? `${Number(pendingChallenge[1]) / 1e18} ETH` : 'NFT Battle'}</p>
            <p>Click accept to join the battle.</p>
          </div>
        )}

        <button
          onClick={() => acceptChallenge(challengerAddress)}
          className="w-full bg-green-500 text-white py-2 rounded font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !challengerAddress}
        >
          {loading ? 'Accepting Challenge...' : 'Accept Challenge'}
        </button>
      </div>

      {/* Debug Info */}
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg text-sm">
        <h4 className="text-gray-400 mb-2">Debug Info:</h4>
        <pre className="text-gray-300 overflow-auto">
          {JSON.stringify({
            address,
            challengerAddress,
            pendingChallenge: pendingChallenge ? {
              battleId: pendingChallenge[0]?.toString(),
              stake: pendingChallenge[1]?.toString(),
              isNFTStake: pendingChallenge[2],
              monsterID: pendingChallenge[3]?.toString(),
              opponentMonster: pendingChallenge[4]?.toString(),
            } : null,
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
} 
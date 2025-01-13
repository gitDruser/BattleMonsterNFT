'use client';

import { useEffect, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '@/config/contracts';
import { Address } from 'viem';

interface BattleStatus {
  inBattle: boolean;
  opponent: Address;
  myHP: bigint;
  opponentHP: bigint;
  myTurn: boolean;
  battleComplete: boolean;
  winner: Address;
}

export function useBattleState() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Get current battle status
  const { data: battleStatus } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getMyBattleStatus',
    args: [],
    query: {
      enabled: !!address && mounted,
      refetchInterval: 2000,
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const parsedStatus: BattleStatus | undefined = battleStatus
    ? {
        inBattle: battleStatus[0],
        opponent: battleStatus[1],
        myHP: battleStatus[2],
        opponentHP: battleStatus[3],
        myTurn: battleStatus[4],
        battleComplete: battleStatus[5],
        winner: battleStatus[6],
      }
    : undefined;

  return {
    battleStatus: parsedStatus,
    isLoading: !mounted,
  };
} 
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { hardhat } from 'viem/chains';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '@/config/contracts';

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http(),
});

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json({ challengers: [], battleIds: [] });
    }

    // Get pending challenge from the opponent
    const pendingChallenge = await publicClient.readContract({
      address: BATTLE_MONSTERS_ADDRESS,
      abi: BATTLE_MONSTERS_ABI,
      functionName: 'getMyPendingChallenge',
      args: [address as `0x${string}`],
    }) as [bigint, bigint, boolean, bigint, bigint];

    // If there's a pending challenge (battleId > 0)
    if (pendingChallenge && pendingChallenge[0] > 0n) {
      return NextResponse.json({
        challengers: [address],
        battleIds: [pendingChallenge[0].toString()],
      });
    }

    return NextResponse.json({ challengers: [], battleIds: [] });
  } catch (error) {
    console.error('Failed to fetch challenges:', error);
    return NextResponse.json({ challengers: [], battleIds: [] });
  }
} 
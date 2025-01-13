'use client';

import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '../config/contracts';
import { parseEther } from 'viem';
import { hardhat } from 'viem/chains';
import { createPublicClient, http } from 'viem';

const publicClient = createPublicClient({
  chain: hardhat,
  transport: http('http://127.0.0.1:8545', {
    batch: false,
    timeout: 30_000,
  }),
});

export function useBattleMonsters() {
  const { address } = useAccount();
  const { writeContract, data: writeData, isPending, isError, error } = useWriteContract();

  // Get battle status
  const { data: battleStatus, refetch: refetchBattleStatus } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'getMyBattleStatus',
    account: address,
    chainId: 31337,
  });

  // Get MINT_PRICE
  const { data: mintPrice, refetch: refetchMintPrice } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'MINT_PRICE',
    chainId: 31337,
  });

  // Get MAX_SUPPLY
  const { data: maxSupply, refetch: refetchMaxSupply } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'MAX_SUPPLY',
    chainId: 31337,
  });

  // Get BATTLE_TIMEOUT
  const { data: battleTimeout, refetch: refetchBattleTimeout } = useReadContract({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    functionName: 'BATTLE_TIMEOUT',
    chainId: 31337,
  });

  // Watch for contract events and refetch data
  useWatchContractEvent({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    eventName: 'Transfer',
    onLogs: () => {
      refetchMintPrice();
      refetchMaxSupply();
    },
  });

  // Watch for battle events
  useWatchContractEvent({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    eventName: 'BattleAction',
    onLogs: (logs) => {
      console.log('Battle Action:', logs);
      refetchBattleStatus();
    },
  });

  useWatchContractEvent({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    eventName: 'CriticalHit',
    onLogs: (logs) => {
      console.log('Critical Hit:', logs);
      refetchBattleStatus();
    },
  });

  useWatchContractEvent({
    address: BATTLE_MONSTERS_ADDRESS,
    abi: BATTLE_MONSTERS_ABI,
    eventName: 'BattleEnded',
    onLogs: (logs) => {
      console.log('Battle Ended:', logs);
      refetchBattleStatus();
    },
  });

  // Helper functions
  const mintMonster = async (quantity: number) => {
    if (!address) {
      console.error('No wallet connected');
      throw new Error('Please connect your wallet first');
    }
    
    if (!mintPrice) {
      console.error('Could not fetch mint price');
      throw new Error('Could not fetch mint price from contract');
    }

    if (!maxSupply) {
      console.error('Could not fetch max supply');
      throw new Error('Could not fetch max supply from contract');
    }

    if (quantity <= 0 || quantity > 3) {
      throw new Error('Invalid quantity. Must be between 1 and 3');
    }
    
    try {
      const totalCost = mintPrice * BigInt(quantity);
      
      console.log('Minting parameters:', {
        address: BATTLE_MONSTERS_ADDRESS,
        quantity,
        mintPrice: mintPrice.toString(),
        totalCost: totalCost.toString(),
        chainId: 31337,
      });
      
      const tx = await writeContract({
        address: BATTLE_MONSTERS_ADDRESS,
        abi: BATTLE_MONSTERS_ABI,
        functionName: 'mint',
        args: [BigInt(quantity)],
        value: totalCost,
        chainId: 31337,
      });
      
      console.log('Mint transaction submitted:', tx);
      return tx;
    } catch (error) {
      console.error('Minting error:', error);
      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient funds to mint monsters');
        } else if (error.message.includes('max supply')) {
          throw new Error('Would exceed maximum supply of monsters');
        } else {
          throw new Error(`Minting failed: ${error.message}`);
        }
      }
      throw error;
    }
  };

  // Get monster details
  const getMonsterDetails = async (tokenId: number) => {
    const data = await publicClient.readContract({
      address: BATTLE_MONSTERS_ADDRESS,
      abi: BATTLE_MONSTERS_ABI,
      functionName: 'getMonster',
      args: [BigInt(tokenId)],
    });
    return data;
  };

  // Battle functions
  const challengePlayer = async (
    opponent: `0x${string}`,
    myMonsterID: number,
    theirMonsterID: number,
    isNFTStake: boolean,
    stakeAmount: string = '0'
  ) => {
    await writeContract({
      address: BATTLE_MONSTERS_ADDRESS,
      abi: BATTLE_MONSTERS_ABI,
      functionName: 'challengePlayer',
      args: [opponent, BigInt(myMonsterID), BigInt(theirMonsterID), isNFTStake],
      value: parseEther(stakeAmount),
      chainId: 31337,
    });
  };

  const acceptChallenge = async (challenger: `0x${string}`, stakeAmount: string = '0', isNFTStake: boolean = false, monsterID?: number) => {
    try {
      console.log('Accepting challenge with params:', {
        challenger,
        stakeAmount,
        isNFTStake,
        monsterID
      });

      // If NFT stake, approve the contract first
      if (isNFTStake && monsterID) {
        console.log('Approving NFT for battle...');
        await writeContract({
          address: BATTLE_MONSTERS_ADDRESS,
          abi: BATTLE_MONSTERS_ABI,
          functionName: 'checkAndApproveNFT',
          args: [BigInt(monsterID)],
          chainId: 31337,
        });
      }

      // Accept the challenge
      const tx = await writeContract({
        address: BATTLE_MONSTERS_ADDRESS,
        abi: BATTLE_MONSTERS_ABI,
        functionName: 'acceptChallenge',
        args: [challenger],
        value: parseEther(stakeAmount),
        chainId: 31337,
      });

      console.log('Challenge accepted:', tx);
      return tx;
    } catch (error) {
      console.error('Error accepting challenge:', error);
      if (error instanceof Error) {
        // Handle specific error cases
        if (error.message.includes('insufficient funds')) {
          throw new Error('Insufficient funds to accept challenge');
        } else if (error.message.includes('not owner')) {
          throw new Error('You do not own this monster');
        } else if (error.message.includes('already in battle')) {
          throw new Error('Monster is already in a battle');
        } else if (error.message.includes('No pending challenge')) {
          throw new Error('No pending challenge from this address');
        } else {
          throw new Error(`Challenge acceptance failed: ${error.message}`);
        }
      }
      throw error;
    }
  };

  const attack = async (guess: number) => {
    if (guess < 1 || guess > 10) {
      throw new Error('Guess must be between 1 and 10');
    }
    await writeContract({
      address: BATTLE_MONSTERS_ADDRESS,
      abi: BATTLE_MONSTERS_ABI,
      functionName: 'attack',
      args: [guess],
      chainId: 31337,
    });
  };

  const timeoutBattle = async (battleId: number) => {
    await writeContract({
      address: BATTLE_MONSTERS_ADDRESS,
      abi: BATTLE_MONSTERS_ABI,
      functionName: 'timeoutBattle',
      args: [BigInt(battleId)],
      chainId: 31337,
    });
  };

  const canAttack = async (battleId: number) => {
    const data = await publicClient.readContract({
      address: BATTLE_MONSTERS_ADDRESS,
      abi: BATTLE_MONSTERS_ABI,
      functionName: 'canAttack',
      args: [BigInt(battleId)],
    });
    return data;
  };

  // Breeding functions
  const breedMonsters = async (parent1Id: number, parent2Id: number) => {
    await writeContract({
      address: BATTLE_MONSTERS_ADDRESS,
      abi: BATTLE_MONSTERS_ABI,
      functionName: 'breedMonsters',
      args: [BigInt(parent1Id), BigInt(parent2Id)],
      chainId: 31337,
    });
  };

  const getBreedingInfo = async (tokenId: number) => {
    const data = await publicClient.readContract({
      address: BATTLE_MONSTERS_ADDRESS,
      abi: BATTLE_MONSTERS_ABI,
      functionName: 'getBreedingInfo',
      args: [BigInt(tokenId)],
    });
    return data;
  };

  // NFT functions
  const checkAndApproveNFT = async (tokenId: number) => {
    await writeContract({
      address: BATTLE_MONSTERS_ADDRESS,
      abi: BATTLE_MONSTERS_ABI,
      functionName: 'checkAndApproveNFT',
      args: [BigInt(tokenId)],
      chainId: 31337,
    });
  };

  const getTokensOfOwner = async (owner: `0x${string}`) => {
    const data = await publicClient.readContract({
      address: BATTLE_MONSTERS_ADDRESS,
      abi: BATTLE_MONSTERS_ABI,
      functionName: 'getTokensOfOwner',
      args: [owner],
    });
    return data;
  };

  const getAllTokens = async () => {
    const data = await publicClient.readContract({
      address: BATTLE_MONSTERS_ADDRESS,
      abi: BATTLE_MONSTERS_ABI,
      functionName: 'getAllTokens',
    });
    return data;
  };

  // Battle state
  const getBattleState = async (battleId: number) => {
    const data = await publicClient.readContract({
      address: BATTLE_MONSTERS_ADDRESS,
      abi: BATTLE_MONSTERS_ABI,
      functionName: 'getBattleState',
      args: [BigInt(battleId)],
    });
    return data;
  };

  return {
    // Constants
    mintPrice,
    maxSupply,
    battleTimeout,
    // Minting
    mintMonster,
    // Monster functions
    getMonsterDetails,
    // Battle functions
    challengePlayer,
    acceptChallenge,
    attack,
    timeoutBattle,
    canAttack,
    getBattleState,
    // Breeding functions
    breedMonsters,
    getBreedingInfo,
    // NFT functions
    checkAndApproveNFT,
    getTokensOfOwner,
    getAllTokens,
    // Status and state
    battleStatus,
    refetchBattleStatus,
    // Transaction state
    isPending,
    isError,
    error,
  };
} 
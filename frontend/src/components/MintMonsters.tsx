'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useTransaction } from 'wagmi';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '@/config/contracts';
import { parseEther } from 'viem';

export function MintMonsters() {
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { address } = useAccount();

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isMinting } = useTransaction({
    hash,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-dark-lighter rounded mb-4"></div>
        <div className="h-4 w-96 bg-dark-lighter rounded mb-12"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-80 bg-dark-lighter rounded-xl"></div>
          <div className="h-80 bg-dark-lighter rounded-xl"></div>
        </div>
      </div>
    );
  }

  const handleIncrement = () => {
    if (quantity < 3) setQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleMint = async () => {
    try {
      await writeContract({
        address: BATTLE_MONSTERS_ADDRESS,
        abi: BATTLE_MONSTERS_ABI,
        functionName: 'mint',
        args: [BigInt(quantity)],
        value: parseEther(totalCost.toString())
      });
    } catch (error) {
      console.error('Failed to mint:', error);
    }
  };

  const pricePerMonster = 0.00001;
  const totalCost = (pricePerMonster * quantity).toFixed(5);

  return (
    <div>
      <h2 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text mb-4">
        Mint Your Battle Monsters
      </h2>
      <p className="text-gray-400 mb-12">
        Create powerful creatures and join the battle arena!
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Minting Controls */}
        <div className="bg-dark/50 rounded-xl p-6">
          <div className="mb-6">
            <label className="text-gray-400 mb-2 block">Select Quantity:</label>
            <div className="flex items-center bg-dark rounded-lg p-2">
              <button
                onClick={handleDecrement}
                className="w-10 h-10 flex items-center justify-center text-2xl text-gray-400 hover:text-white transition-colors"
              >
                -
              </button>
              <div className="flex-1 text-center text-2xl font-bold">
                {quantity}
                <div className="text-xs text-gray-500">MAX: 3</div>
              </div>
              <button
                onClick={handleIncrement}
                className="w-10 h-10 flex items-center justify-center text-2xl text-gray-400 hover:text-white transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Price per monster:</span>
              <span>{pricePerMonster} ETH</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total cost:</span>
              <span className="text-primary">{totalCost} ETH</span>
            </div>
          </div>

          <button
            onClick={handleMint}
            disabled={!address || isMinting}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all
              ${!address 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90'
              }
            `}
          >
            {!address 
              ? 'Connect Wallet to Mint' 
              : isMinting 
                ? 'Minting...' 
                : 'Mint Your Monsters'
            }
          </button>
        </div>

        {/* Right Column - Monster Attributes */}
        <div className="bg-dark/50 rounded-xl p-6">
          <h3 className="text-xl font-bold text-primary mb-6">Monster Attributes</h3>
          
          <div className="space-y-4">
            <div className="bg-dark/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-red-900/50 rounded-lg flex items-center justify-center">⚔️</div>
                <h4 className="font-bold text-red-400">Attack</h4>
              </div>
              <p className="text-gray-400 text-sm">Determines damage dealt in battles</p>
            </div>

            <div className="bg-dark/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-900/50 rounded-lg flex items-center justify-center">🛡️</div>
                <h4 className="font-bold text-blue-400">Defense</h4>
              </div>
              <p className="text-gray-400 text-sm">Increases HP and reduces damage taken</p>
            </div>

            <div className="bg-dark/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-900/50 rounded-lg flex items-center justify-center">⚡</div>
                <h4 className="font-bold text-green-400">Speed</h4>
              </div>
              <p className="text-gray-400 text-sm">Affects turn order in battles</p>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>Mint up to 3 monsters per transaction</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>Limited supply of 10 unique monsters</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span>Each monster is an NFT that can be traded or wagered</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
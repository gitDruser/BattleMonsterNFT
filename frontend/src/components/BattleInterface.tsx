'use client';

import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { BATTLE_MONSTERS_ABI, BATTLE_MONSTERS_ADDRESS } from '@/config/contracts';
import { useBattleState } from '@/hooks/useBattleState';

export function BattleInterface() {
  const [guess, setGuess] = useState<number>(1);
  const { writeContract } = useWriteContract();
  const { battleStatus, isLoading } = useBattleState();

  const handleAttack = async () => {
    if (!battleStatus?.inBattle || !battleStatus.myTurn) return;

    try {
      await writeContract({
        address: BATTLE_MONSTERS_ADDRESS,
        abi: BATTLE_MONSTERS_ABI,
        functionName: 'attack',
        args: [guess],
      });
    } catch (error) {
      console.error('Failed to attack:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-64 bg-dark-lighter rounded mb-4"></div>
        <div className="h-48 bg-dark-lighter rounded-xl"></div>
      </div>
    );
  }

  if (!battleStatus?.inBattle) {
    return (
      <div className="bg-dark/50 rounded-xl p-6">
        <p className="text-gray-400">You are not in a battle</p>
      </div>
    );
  }

  const myHPPercentage = Number(battleStatus.myHP) / 100;
  const opponentHPPercentage = Number(battleStatus.opponentHP) / 100;

  return (
    <div className="bg-dark/50 rounded-xl p-6 space-y-6">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
        Battle Arena
      </h2>

      {battleStatus.battleComplete ? (
        <div className="text-center py-8">
          <h3 className="text-xl font-bold mb-4">
            Battle Complete!
          </h3>
          <p className="text-gray-400">
            {battleStatus.winner === battleStatus.opponent 
              ? 'You lost the battle' 
              : 'You won the battle!'}
          </p>
        </div>
      ) : (
        <>
          {/* Battle Status */}
          <div className="grid grid-cols-2 gap-8">
            {/* Your Status */}
            <div>
              <h3 className="text-lg font-medium mb-2">Your HP</h3>
              <div className="w-full h-4 bg-dark rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-600 transition-all duration-500"
                  style={{ width: `${myHPPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-1">{battleStatus.myHP.toString()} / 100</p>
            </div>

            {/* Opponent Status */}
            <div>
              <h3 className="text-lg font-medium mb-2">Opponent HP</h3>
              <div className="w-full h-4 bg-dark rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-600 transition-all duration-500"
                  style={{ width: `${opponentHPPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-1">{battleStatus.opponentHP.toString()} / 100</p>
            </div>
          </div>

          {/* Attack Controls */}
          <div className="bg-dark/50 rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">Make Your Move</h3>
            
            {battleStatus.myTurn ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">
                    Guess a number (1-10) for Critical Hit:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={guess}
                    onChange={(e) => setGuess(Math.min(10, Math.max(1, Number(e.target.value))))}
                    className="w-full bg-dark rounded-lg p-2 text-white"
                  />
                </div>
                
                <button
                  onClick={handleAttack}
                  className="w-full py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-red-500 to-purple-600 hover:opacity-90 transition-all"
                >
                  Attack!
                </button>
              </div>
            ) : (
              <p className="text-gray-400">
                Waiting for opponent's move...
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
} 
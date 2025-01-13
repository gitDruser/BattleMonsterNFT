import { sepolia } from 'viem/chains';

// Contract deployed on local hardhat network
export const BATTLE_MONSTERS_ADDRESS = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0" as const;

export const BATTLE_MONSTERS_ABI = [
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'battleId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'challenger', type: 'address' },
      { indexed: false, internalType: 'address', name: 'opponent', type: 'address' }
    ],
    name: 'BattleInitiated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'battleId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'player', type: 'address' },
      { indexed: false, internalType: 'string', name: 'actionType', type: 'string' },
      { indexed: false, internalType: 'uint256', name: 'damage', type: 'uint256' }
    ],
    name: 'BattleAction',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'battleId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'winner', type: 'address' }
    ],
    name: 'BattleEnded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: 'uint256', name: 'battleId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'challenger', type: 'address' },
      { indexed: false, internalType: 'address', name: 'opponent', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'stake', type: 'uint256' },
      { indexed: false, internalType: 'bool', name: 'isNFTStake', type: 'bool' }
    ],
    name: 'ChallengeIssued',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'battleId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'attacker', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'damage', type: 'uint256' }
    ],
    name: 'CriticalHit',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'battleId', type: 'uint256' },
      { indexed: false, internalType: 'uint8', name: 'secretNumber', type: 'uint8' },
      { indexed: false, internalType: 'uint8', name: 'guess', type: 'uint8' },
      { indexed: false, internalType: 'bool', name: 'wasCritical', type: 'bool' }
    ],
    name: 'SecretNumberRevealed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'newMonsterId', type: 'uint256' },
      { indexed: true, internalType: 'uint256', name: 'parent1Id', type: 'uint256' },
      { indexed: true, internalType: 'uint256', name: 'parent2Id', type: 'uint256' }
    ],
    name: 'MonsterBred',
    type: 'event',
  },
  // Constants
  {
    inputs: [],
    name: 'MINT_PRICE',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MAX_SUPPLY',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'BATTLE_TIMEOUT',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Minting
  {
    inputs: [{ internalType: 'uint256', name: 'quantity', type: 'uint256' }],
    name: 'mint',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
  // Monster Functions
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getMonster',
    outputs: [
      { internalType: 'uint32', name: 'attack', type: 'uint32' },
      { internalType: 'uint32', name: 'defense', type: 'uint32' },
      { internalType: 'uint32', name: 'speed', type: 'uint32' },
      { internalType: 'bool', name: 'isGenesis', type: 'bool' },
      { internalType: 'bool', name: 'hasBreed', type: 'bool' },
      { internalType: 'uint32', name: 'parent1Id', type: 'uint32' },
      { internalType: 'uint32', name: 'parent2Id', type: 'uint32' },
      { internalType: 'uint32', name: 'breedingCooldown', type: 'uint32' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Battle Functions
  {
    inputs: [{ internalType: 'uint8', name: 'guess', type: 'uint8' }],
    name: 'attack',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_battleId', type: 'uint256' }],
    name: 'timeoutBattle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'battleId', type: 'uint256' }],
    name: 'canAttack',
    outputs: [
      { internalType: 'bool', name: 'canAct', type: 'bool' },
      { internalType: 'string', name: 'reason', type: 'string' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Challenge Functions
  {
    inputs: [
      { internalType: 'address', name: '_opponent', type: 'address' },
      { internalType: 'uint256', name: '_myMonsterID', type: 'uint256' },
      { internalType: 'uint256', name: '_theirMonsterID', type: 'uint256' },
      { internalType: 'bool', name: '_isNFTStake', type: 'bool' }
    ],
    name: 'challengePlayer',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'challenger', type: 'address' }],
    name: 'acceptChallenge',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_opponent', type: 'address' }],
    name: 'cancelChallenge',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_opponent', type: 'address' }],
    name: 'getMyPendingChallenge',
    outputs: [
      { internalType: 'uint256', name: 'battleId', type: 'uint256' },
      { internalType: 'uint256', name: 'stake', type: 'uint256' },
      { internalType: 'bool', name: 'isNFTStake', type: 'bool' },
      { internalType: 'uint256', name: 'challengerMonsterID', type: 'uint256' },
      { internalType: 'uint256', name: 'opponentMonsterID', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Battle Status Functions
  {
    inputs: [],
    name: 'getMyBattleStatus',
    outputs: [
      { internalType: 'bool', name: 'inBattle', type: 'bool' },
      { internalType: 'address', name: 'opponent', type: 'address' },
      { internalType: 'uint256', name: 'myHP', type: 'uint256' },
      { internalType: 'uint256', name: 'opponentHP', type: 'uint256' },
      { internalType: 'bool', name: 'myTurn', type: 'bool' },
      { internalType: 'bool', name: 'battleComplete', type: 'bool' },
      { internalType: 'address', name: 'winner', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'battleId', type: 'uint256' }],
    name: 'getBattleState',
    outputs: [
      { internalType: 'address', name: 'challenger', type: 'address' },
      { internalType: 'address', name: 'opponent', type: 'address' },
      { internalType: 'uint256', name: 'challengerHP', type: 'uint256' },
      { internalType: 'uint256', name: 'opponentHP', type: 'uint256' },
      { internalType: 'bool', name: 'isChallenger', type: 'bool' },
      { internalType: 'bool', name: 'isMyTurn', type: 'bool' },
      { internalType: 'bool', name: 'isCompleted', type: 'bool' },
      { internalType: 'address', name: 'winner', type: 'address' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address[]', name: '_potentialChallengers', type: 'address[]' }],
    name: 'getIncomingChallenges',
    outputs: [
      { internalType: 'address[]', name: 'challengers', type: 'address[]' },
      { internalType: 'uint256[]', name: 'battleIds', type: 'uint256[]' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Breeding Functions
  {
    inputs: [
      { internalType: 'uint256', name: 'parent1Id', type: 'uint256' },
      { internalType: 'uint256', name: 'parent2Id', type: 'uint256' }
    ],
    name: 'breedMonsters',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getBreedingInfo',
    outputs: [
      { internalType: 'bool', name: 'canBreed', type: 'bool' },
      { internalType: 'bool', name: 'isGenesis', type: 'bool' },
      { internalType: 'bool', name: 'hasBreedBefore', type: 'bool' },
      { internalType: 'uint256', name: 'cooldownEnd', type: 'uint256' },
      { internalType: 'uint256', name: 'parent1Id', type: 'uint256' },
      { internalType: 'uint256', name: 'parent2Id', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // NFT Functions
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'checkAndApproveNFT',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'getTokensOfOwner',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllTokens',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  }
] as const; 
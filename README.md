# BattleMonsters Smart ContractTesting Guide

## Initial Setup
1. Deploy the contract with any account
2. Note down the contract address

## Step 1: Create Your First Monsters
1. Use `mint(1)` with 0.00001 ETH to create your first monster
2. Switch to a different account
3. Use `mint(1)` again to create a monster for the opponent
4. Use `getAllTokens()` to see all minted monsters
5. Use `getTokensOfOwner(your_address)` to see your monsters

## Step 2: Check Monster Stats
1. Use `monsters(tokenId)` to view your monster's stats
   - Note down the attack, defense, and speed values
   - Check if it's a Genesis monster (isGenesis)

## Step 3: Prepare for Battle
1. Use `checkAndApproveNFT(yourMonsterID)` with your account
2. Switch to the opponent's account
3. Use `checkAndApproveNFT(theirMonsterID)` with their monster

## Step 4: Start a Battle
1. With your first account, use `challengePlayer`:
   - Opponent's address
   - Your monster ID
   - Their monster ID
   - Set isNFTStake to false first (easier testing)
2. Switch to opponent's account
3. Use `acceptChallenge(challenger_address)` to start the battle

## Step 5: Battle
1. Check whose turn it is with `getMyBattleStatus()`
2. Use `attack(guess)` with a number 1-10
3. Switch accounts
4. Check battle stats with `getBattleStats(battleId)`
5. Make opponent attack with `attack(guess)`
6. Repeat until someone wins

## Step 6: Try NFT Stake Battle
1. Start a new battle but set isNFTStake to true
2. Notice how NFTs are transferred to contract during battle
3. Winner gets both NFTs

## Step 7: Test Breeding
1. Mint two Genesis monsters with same account
2. Use `breedMonsters(parent1Id, parent2Id)`
3. Check new monster stats
4. Verify breeding cooldown with `getBreedingInfo(tokenId)`

## Common Test Scenarios
1. Try attacking when it's not your turn
2. Try using a monster you don't own
3. Try breeding non-Genesis monsters
4. Try breeding same monster twice
5. Test battle timeout with `timeoutBattle(battleId)`

## Advanced Testing
1. Create multiple battles simultaneously
2. Test critical hits system with different guesses
3. Try canceling challenges with `cancelChallenge`
4. Check battle history through events

Remix IDE Compile options:

Advanced Configurations -> Check optimization - 200 and Use configuration file with:

compiler_config.json:
{
    "language": "Solidity",
    "settings": {
        "optimizer": {
            "enabled": true,
            "runs": 200
        },
        "viaIR": true,
        "outputSelection": {
            "*": {
                "": ["ast"],
                "*": ["abi", "metadata", "devdoc", "userdoc", "storageLayout", "evm.legacyAssembly", "evm.bytecode", "evm.deployedBytecode", "evm.methodIdentifiers", "evm.gasEstimates", "evm.assembly"]
            }
        }
    }
}

## Frontend Setup Guide

### Prerequisites
- Node.js (v18 or later)
- MetaMask browser extension
- Hardhat for local blockchain

### Step 1: Clone and Install Dependencies
- Install dependencies for both contract and frontend

### Step 2: Start Local Blockchain and Deploy Contract
1. Open a new terminal and start the Hardhat node
```bash
# In the ETH_Smartcontract directory
npx hardhat node
```

2. Open another terminal and deploy the contract
```bash
# In the ETH_Smartcontract directory
npx hardhat run scripts/deploy.ts --network localhost
```

3. Copy the deployed contract address and update it in `frontend/src/config/contracts.ts`
```typescript
export const BATTLE_MONSTERS_ADDRESS = "your_deployed_contract_address" as const;
```

### Step 3: Configure MetaMask
1. Add Hardhat Network to MetaMask:
   - Network Name: Hardhat
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. Import the first test account from Hardhat:
   - Click "Import Account" in MetaMask
   - Paste the private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This account has 10,000 test ETH

### Step 4: Start the Frontend
1. Start the Next.js development server
```bash
# In the frontend directory
npm run dev
```

2. Open your browser and navigate to http://localhost:3000

### Step 5: Testing the Integration
1. Connect your MetaMask wallet to the website
2. Try minting a monster (costs 0.00001 ETH)
3. View your monster in the gallery
4. Try breeding (or battling)

### Troubleshooting
1. If transactions fail:
   - Make sure you're connected to the correct network in MetaMask
   - Verify the contract address in `contracts.ts` matches the deployed address
   - Check if the Hardhat node is running
   - Reset your MetaMask account if you've restarted the Hardhat node

2. If the frontend can't connect:
   - Ensure the Hardhat node is running
   - Check if the contract is deployed
   - Verify your MetaMask is connected to Hardhat network
   - Try clearing your browser cache and MetaMask activity

3. Common Issues:
   - "Invalid nonce" - Reset your MetaMask account
   - "Contract not deployed" - Double check the contract address
   - "Insufficient funds" - Make sure you're using an account with test ETH

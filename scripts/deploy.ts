import { viem } from "hardhat";

async function main() {
  const publicClient = await viem.getPublicClient();
  const [account] = await viem.getWalletClients();
  
  console.log("Deploying BattleMonsters contract with account:", account.account.address);

  const battleMonsters = await viem.deployContract("BattleMonsters");

  console.log("BattleMonsters deployed to:", battleMonsters.address);
  
  console.log("\nUpdate your frontend configuration with:");
  console.log(`BATTLE_MONSTERS_ADDRESS="${battleMonsters.address}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
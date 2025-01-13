import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import hre from "hardhat";
import { getAddress, parseEther } from "viem";

describe("BattleMonsters", function () {
  async function deployBattleMonstersFixture() {
    const [owner, player1, player2] = await hre.viem.getWalletClients();
    
    const battleMonsters = await hre.viem.deployContract("BattleMonsters");
    const publicClient = await hre.viem.getPublicClient();
    
    return { battleMonsters, owner, player1, player2, publicClient };
  }

  describe("Minting", function () {
    it("Should mint new monsters", async function () {
      const { battleMonsters, player1 } = await loadFixture(deployBattleMonstersFixture);
      
      const mintPrice = await battleMonsters.read.MINT_PRICE();
      await battleMonsters.write.mint([1], { value: mintPrice, account: player1.account });
      
      const balance = await battleMonsters.read.balanceOf([player1.account.address]);
      expect(balance).to.equal(1n);
    });

    it("Should not mint more than MAX_MINT_PER_TX", async function () {
      const { battleMonsters, player1 } = await loadFixture(deployBattleMonstersFixture);
      
      const mintPrice = await battleMonsters.read.MINT_PRICE();
      await expect(
        battleMonsters.write.mint([4], { value: mintPrice * 4n, account: player1.account })
      ).to.be.rejected;
    });
  });

  describe("Battle System", function () {
    it("Should allow challenging another player", async function () {
      const { battleMonsters, player1, player2 } = await loadFixture(deployBattleMonstersFixture);
      
      // Mint monsters for both players
      const mintPrice = await battleMonsters.read.MINT_PRICE();
      await battleMonsters.write.mint([1], { value: mintPrice, account: player1.account });
      await battleMonsters.write.mint([1], { value: mintPrice, account: player2.account });
      
      // Challenge player2
      await battleMonsters.write.challengePlayer(
        [player2.account.address, 1n, 2n, false],
        { account: player1.account }
      );
      
      const challenge = await battleMonsters.read.getMyPendingChallenge(
        [player2.account.address],
        { account: player1.account }
      );
      
      expect(challenge[0]).to.not.equal(0n); // battleId should be set
    });

    it("Should allow accepting challenges", async function () {
      const { battleMonsters, player1, player2 } = await loadFixture(deployBattleMonstersFixture);
      
      // Mint monsters for both players
      const mintPrice = await battleMonsters.read.MINT_PRICE();
      await battleMonsters.write.mint([1], { value: mintPrice, account: player1.account });
      await battleMonsters.write.mint([1], { value: mintPrice, account: player2.account });
      
      // Challenge and accept
      await battleMonsters.write.challengePlayer(
        [player2.account.address, 1n, 2n, false],
        { account: player1.account }
      );
      
      await battleMonsters.write.acceptChallenge(
        [player1.account.address],
        { account: player2.account }
      );
      
      const battleStatus = await battleMonsters.read.getMyBattleStatus(
        { account: player1.account }
      );
      
      expect(battleStatus[0]).to.be.true; // inBattle should be true
    });

    it("Should allow attacking in battle", async function () {
      const { battleMonsters, player1, player2 } = await loadFixture(deployBattleMonstersFixture);
      
      // Mint monsters for both players
      const mintPrice = await battleMonsters.read.MINT_PRICE();
      await battleMonsters.write.mint([1], { value: mintPrice, account: player1.account });
      await battleMonsters.write.mint([1], { value: mintPrice, account: player2.account });
      
      // Setup battle
      await battleMonsters.write.challengePlayer(
        [player2.account.address, 1n, 2n, false],
        { account: player1.account }
      );
      
      await battleMonsters.write.acceptChallenge(
        [player1.account.address],
        { account: player2.account }
      );
      
      // Attack
      await battleMonsters.write.attack([5], { account: player1.account });
      
      const battleStatus = await battleMonsters.read.getMyBattleStatus(
        { account: player1.account }
      );
      
      expect(battleStatus[4]).to.be.false; // myTurn should be false after attacking
    });
  });

  describe("Breeding System", function () {
    it("Should allow breeding of genesis monsters", async function () {
      const { battleMonsters, player1 } = await loadFixture(deployBattleMonstersFixture);
      
      // Mint two genesis monsters
      const mintPrice = await battleMonsters.read.MINT_PRICE();
      await battleMonsters.write.mint([2], { value: mintPrice * 2n, account: player1.account });
      
      // Breed monsters
      await battleMonsters.write.breedMonsters([1n, 2n], { account: player1.account });
      
      const balance = await battleMonsters.read.balanceOf([player1.account.address]);
      expect(balance).to.equal(3n); // Should have 3 monsters after breeding
      
      // Check breeding cooldown
      const breedingInfo = await battleMonsters.read.getBreedingInfo([1n]);
      expect(breedingInfo[2]).to.be.true; // hasBreedBefore should be true
    });

    it("Should not allow breeding of non-genesis monsters", async function () {
      const { battleMonsters, player1 } = await loadFixture(deployBattleMonstersFixture);
      
      // Mint two genesis monsters
      const mintPrice = await battleMonsters.read.MINT_PRICE();
      await battleMonsters.write.mint([2], { value: mintPrice * 2n, account: player1.account });
      
      // Breed first pair
      await battleMonsters.write.breedMonsters([1n, 2n], { account: player1.account });
      
      // Try to breed with offspring
      await expect(
        battleMonsters.write.breedMonsters([1n, 3n], { account: player1.account })
      ).to.be.rejected;
    });
  });
}); 
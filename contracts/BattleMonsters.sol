// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract BattleMonsters is ERC721, Ownable, ReentrancyGuard, IERC721Receiver {
    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _bredTokenIds;

    // Monster struct
    struct Monster {
        uint32 attack;
        uint32 defense;
        uint32 speed;
        bool isGenesis;
        bool hasBreed;
        uint32 parent1Id;
        uint32 parent2Id;
        uint32 breedingCooldown;
    }

    struct BattleStats {
        uint32 currentHP;
        uint32 maxHP;
        uint32 criticalHits;
    }

    struct Battle {
        address challenger;
        address opponent;
        uint32 challengerMonsterID;
        uint32 opponentMonsterID;
        uint256 stake;
        bool isNFTStake;
        uint32 lastActionTime;
        uint32 currentTurn;
        BattleStats challengerStats;
        BattleStats opponentStats;
        bool isActive;
        bool isCompleted;
        address winner;
        uint8 secretNumber; 
    }

    // STORAGE
    mapping(uint256 => Monster) public monsters;
    mapping(uint256 => Battle) public battles;
    uint256 private battleNonce;
    
    uint256[] private _allTokens;
    
    mapping(address => uint256) public activeBattles;
    mapping(address => mapping(address => uint256)) public pendingChallenges;
    
    // CONSTANTS
    uint256 public constant MAX_SUPPLY = 99;
    uint256 public constant MAX_MINT_PER_TX = 3;
    uint256 public constant BATTLE_TIMEOUT = 5 minutes;
    uint256 public constant BASE_HP = 100;
    uint256 public constant BREEDING_COOLDOWN = 1 days;
    uint256 public constant MAX_BRED_MONSTERS = 99;
    uint256 public constant MINT_PRICE = 0.00001 ether;
    
    // EVENTS
    event BattleInitiated(uint256 battleId, address challenger, address opponent);
    event BattleAccepted(uint256 battleId);
    event BattleAction(uint256 battleId, address player, string actionType, uint256 damage);
    event BattleEnded(uint256 battleId, address winner);
    event ChallengeIssued(uint256 battleId, address challenger, address opponent, uint256 stake, bool isNFTStake);
    event ChallengeAccepted(uint256 battleId, address challenger, address opponent);
    event ChallengeCancelled(uint256 battleId, address challenger, address opponent);
    event BattleStarted(uint256 battleId, address player1, address player2);
    event MonsterBred(uint256 indexed newMonsterId, uint256 indexed parent1Id, uint256 indexed parent2Id);
    event CriticalHit(uint256 indexed battleId, address attacker, uint256 damage);
    event SecretNumberRevealed(uint256 indexed battleId, uint8 secretNumber, uint8 guess, bool wasCritical);

    constructor() ERC721("BattleMonsters", "BMON") {}

    // ADMIN FUNCTIONS
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    // Helper function to create monster stats
    function _createMonster(uint256 monsterId) private view returns (Monster memory) {
        uint32 attackStat = uint32(_generateStat("ATK", monsterId));
        uint32 defense = uint32(_generateStat("DEF", monsterId));
        uint32 speed = uint32(_generateStat("SPD", monsterId));
        return Monster(
            attackStat,
            defense,
            speed,
            true,
            false,
            0,
            0,
            0
        );
    }

    // MINTING FUNCTIONS
    function mint(uint256 quantity) public payable nonReentrant returns (uint256[] memory) {
        require(quantity > 0 && quantity <= MAX_MINT_PER_TX, "Invalid quantity");
        require(_tokenIds.current() + quantity <= MAX_SUPPLY, "Would exceed max supply");
        
        uint256 totalCost = MINT_PRICE * quantity;
        require(msg.value >= totalCost, "Insufficient payment");
        
        uint256[] memory newTokenIds = new uint256[](quantity);
        
        for(uint256 i = 0; i < quantity; i++) {
            _tokenIds.increment();
            uint256 newMonsterId = _tokenIds.current();
            
            monsters[newMonsterId] = _createMonster(newMonsterId);
            _safeMint(msg.sender, newMonsterId);
            _allTokens.push(newMonsterId);
            newTokenIds[i] = newMonsterId;
        }
        
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
        
        return newTokenIds;
    }

    // VIEW FUNCTIONS
    function getAllTokens() public view returns (uint256[] memory) {
        return _allTokens;
    }

    function getTokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokens = new uint256[](tokenCount);
        uint256 counter = 0;
        
        for (uint256 i = 0; i < _allTokens.length; i++) {
            if (ownerOf(_allTokens[i]) == owner) {
                tokens[counter] = _allTokens[i];
                counter++;
            }
        }
        
        return tokens;
    }

    // Required override
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // BATTLE FUNCTIONS
    function attack(uint8 guess) public {
        uint256 battleId = activeBattles[msg.sender];
        require(battleId != 0, "Not in battle");
        
        Battle storage battle = battles[battleId];
        require(battle.isActive, "Battle not active");
        require(!battle.isCompleted, "Battle already completed");
        
        // Check if it's player's turn
        bool isChallenger = (msg.sender == battle.challenger);
        require(
            (battle.currentTurn % 2 == 0 && isChallenger) || 
            (battle.currentTurn % 2 == 1 && !isChallenger),
            "Not your turn"
        );
        
        require(guess >= 1 && guess <= 10, "Guess must be between 1-10");
        
        BattleStats storage attackerStats = isChallenger ? battle.challengerStats : battle.opponentStats;
        BattleStats storage defenderStats = isChallenger ? battle.opponentStats : battle.challengerStats;
        Monster memory attackerMonster = monsters[isChallenger ? battle.challengerMonsterID : battle.opponentMonsterID];
        
        // Calculate base damage
        uint32 damage = uint32(attackerMonster.attack);
        
        // Gen secret number for each turn
        uint8 secretNumber = uint8(uint256(keccak256(abi.encodePacked(
            block.timestamp,
            battle.currentTurn,
            battleId
        ))) % 10) + 1;  // 1-10
        
        // If player guesses correctly, apply double damage
        bool isCriticalHit = (guess == secretNumber);
        if (isCriticalHit) {
            damage = damage * 2;  
            attackerStats.criticalHits++;
            emit CriticalHit(battleId, msg.sender, damage);
        }
        
        // Apply damage
        if (defenderStats.currentHP <= damage) {
            defenderStats.currentHP = 0;
            _endBattle(battleId, msg.sender);
        } else {
            defenderStats.currentHP -= damage;
        }
        
        // Increment turn
        battle.currentTurn++;
        battle.lastActionTime = uint32(block.timestamp);
        
        emit BattleAction(battleId, msg.sender, "attack", damage);
        emit SecretNumberRevealed(battleId, secretNumber, guess, isCriticalHit);
    }

    function _calculateDamage(uint256 attackStat) internal view returns (uint256) {
        // Base damage is attack stat plus random factor
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            "DMG",
            attackStat
        ))) % 20;
        
        return attackStat + random;
    }

    function _endBattle(uint256 _battleId, address winner) internal {
        Battle storage battle = battles[_battleId];
        battle.isCompleted = true;
        battle.winner = winner;
        
        // Handle ETH rewards
        if (battle.stake > 0) {
            uint256 totalStake = battle.stake * 2;
            payable(winner).transfer(totalStake);
        }

        // Handle NFT rewards
        if (battle.isNFTStake) {
            try this.safeTransferFrom(address(this), winner, battle.challengerMonsterID) {
            } catch {
                emit BattleAction(_battleId, winner, "NFT transfer failed", 0);
            }
            
            try this.safeTransferFrom(address(this), winner, battle.opponentMonsterID) {
            } catch {
                emit BattleAction(_battleId, winner, "NFT transfer failed", 0);
            }
        }
        
        emit BattleEnded(_battleId, winner);
    }

    function timeoutBattle(uint256 _battleId) public {
        Battle storage battle = battles[_battleId];
        require(battle.isActive && !battle.isCompleted, "Battle not active");
        require(block.timestamp > battle.lastActionTime + BATTLE_TIMEOUT, "Timeout not reached");
        
        // Last player to act wins (based on currentTurn)
        address winner;
        if (battle.currentTurn % 2 == 1) {
            // If currentTurn is odd, challenger was the last to act
            winner = battle.challenger;
        } else if (battle.currentTurn % 2 == 0 && battle.currentTurn > 0) {
            // If currentTurn is even and greater than 0, opponent was the last to act
            winner = battle.opponent;
        } else {
            // If currentTurn is 0, neither acted, return stakes
            if (battle.isNFTStake) {
                safeTransferFrom(address(this), battle.challenger, battle.challengerMonsterID);
                safeTransferFrom(address(this), battle.opponent, battle.opponentMonsterID);
            } else if (battle.stake > 0) {
                payable(battle.challenger).transfer(battle.stake);
                payable(battle.opponent).transfer(battle.stake);
            }
            battle.isCompleted = true;
            emit BattleEnded(_battleId, address(0));
            return;
        }
        
        _endBattle(_battleId, winner);
    }

    // UTILITY FUNCTIONS
    function getMonster(uint256 tokenId) public view returns (Monster memory) {
        ownerOf(tokenId);
        return monsters[tokenId];
    }

    function _generateStat(string memory statType, uint256 seed) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            statType,
            seed
        ))) % 100 + 1;
    }

    function getBattleStatus(uint256 _battleId) public view returns (
        uint256 challengerHP,
        uint256 opponentHP,
        bool challengerActed,
        bool opponentActed,
        uint256 currentTurn,
        bool isActive,
        bool isCompleted,
        address winner
    ) {
        Battle storage battle = battles[_battleId];
        
        bool _challengerActed = battle.currentTurn % 2 == 1;
        bool _opponentActed = battle.currentTurn % 2 == 0 && battle.currentTurn > 0;
        
        return (
            battle.challengerStats.currentHP,
            battle.opponentStats.currentHP,
            _challengerActed,
            _opponentActed,
            battle.currentTurn,
            battle.isActive,
            battle.isCompleted,
            battle.winner
        );
    }

    // DIRECT CHALLENGE FUNCTIONS
    function challengePlayer(
        address _opponent,
        uint256 _myMonsterID,
        uint256 _theirMonsterID,
        bool _isNFTStake
    ) public payable returns (uint256) {
        require(_opponent != address(0) && _opponent != msg.sender, "Invalid opponent");
        require(ownerOf(_myMonsterID) == msg.sender, "Not owner of monster");
        require(ownerOf(_theirMonsterID) == _opponent, "Opponent not owner of monster");
        
        if (_isNFTStake) {
            // Check if contract is approved to handle the NFT
            require(
                getApproved(_myMonsterID) == address(this) || 
                isApprovedForAll(msg.sender, address(this)),
                "Contract not approved for NFT"
            );
        }

        require(activeBattles[msg.sender] == 0, "Already in battle");
        require(activeBattles[_opponent] == 0, "Opponent in battle");
        require(pendingChallenges[msg.sender][_opponent] == 0, "Already challenged");
        
        uint256 battleId = ++battleNonce;
        pendingChallenges[msg.sender][_opponent] = battleId;
        
        // Calc HP
        uint32 myHP = uint32(BASE_HP + (monsters[_myMonsterID].defense * 2));
        uint32 theirHP = uint32(BASE_HP + (monsters[_theirMonsterID].defense * 2));
        
        battles[battleId] = Battle({
            challenger: msg.sender,
            opponent: _opponent,
            challengerMonsterID: uint32(_myMonsterID),
            opponentMonsterID: uint32(_theirMonsterID),
            stake: msg.value,
            isNFTStake: _isNFTStake,
            lastActionTime: uint32(block.timestamp),
            currentTurn: 0,
            challengerStats: BattleStats({
                currentHP: myHP,
                maxHP: myHP,
                criticalHits: 0
            }),
            opponentStats: BattleStats({
                currentHP: theirHP,
                maxHP: theirHP,
                criticalHits: 0
            }),
            isActive: false,
            isCompleted: false,
            winner: address(0),
            secretNumber: 0
        });
        
        if (_isNFTStake) {
            safeTransferFrom(msg.sender, address(this), _myMonsterID);
        }
        
        emit ChallengeIssued(battleId, msg.sender, _opponent, msg.value, _isNFTStake);
        return battleId;
    }
    
    function acceptChallenge(address challenger) public payable {
        uint256 battleId = pendingChallenges[challenger][msg.sender];
        require(battleId != 0, "No pending challenge");
        
        Battle storage battle = battles[battleId];
        require(!battle.isActive, "Battle already active");
        require(msg.sender == battle.opponent, "Not the challenged player");
        
        if (battle.isNFTStake) {
            require(ownerOf(battle.opponentMonsterID) == msg.sender, "Don't own the monster");
            // Check if contract is approved to handle the NFT
            require(
                getApproved(battle.opponentMonsterID) == address(this) || 
                isApprovedForAll(msg.sender, address(this)),
                "Contract not approved for NFT"
            );
            safeTransferFrom(msg.sender, address(this), battle.opponentMonsterID);
        } else {
            require(msg.value == battle.stake, "Incorrect stake amount");
        }
        
        battle.isActive = true;
        battle.lastActionTime = uint32(block.timestamp);
        activeBattles[challenger] = battleId;
        activeBattles[msg.sender] = battleId;
        
        emit ChallengeAccepted(battleId, challenger, msg.sender);
        emit BattleStarted(battleId, challenger, msg.sender);
    }
    
    function cancelChallenge(address _opponent) public {
        uint256 battleId = pendingChallenges[msg.sender][_opponent];
        require(battleId != 0, "No pending challenge");
        
        Battle storage battle = battles[battleId];
        
        // Return NFT if staked
        if (battle.isNFTStake) {
            safeTransferFrom(address(this), msg.sender, battle.challengerMonsterID);
        }
        
        // Return ETH stake
        if (battle.stake > 0) {
            payable(msg.sender).transfer(battle.stake);
        }
        
        delete pendingChallenges[msg.sender][_opponent];
        delete battles[battleId];
        
        emit ChallengeCancelled(battleId, msg.sender, _opponent);
    }

    // Check pending challenges
    function getMyPendingChallenge(address _opponent) public view returns (
        uint256 battleId,
        uint256 stake,
        bool isNFTStake,
        uint256 monsterID,
        uint256 opponentMonsterID
    ) {
        battleId = pendingChallenges[msg.sender][_opponent];
        if (battleId != 0) {
            Battle storage battle = battles[battleId];
            return (
                battleId,
                battle.stake,
                battle.isNFTStake,
                battle.challengerMonsterID,
                battle.opponentMonsterID
            );
        }
    }

    // Check battle status
    function getMyBattleStatus() public view returns (
        bool inBattle,
        address opponent,
        uint256 myHP,
        uint256 opponentHP,
        bool myTurn,
        bool battleComplete,
        address winner
    ) {
        uint256 battleId = activeBattles[msg.sender];
        if (battleId == 0) return (false, address(0), 0, 0, false, false, address(0));

        Battle storage battle = battles[battleId];
        bool isChallenger = (msg.sender == battle.challenger);
        
        bool isMyTurn = (battle.currentTurn % 2 == 0 && isChallenger) || 
                        (battle.currentTurn % 2 == 1 && !isChallenger);
        
        return (
            true,
            isChallenger ? battle.opponent : battle.challenger,
            isChallenger ? battle.challengerStats.currentHP : battle.opponentStats.currentHP,
            isChallenger ? battle.opponentStats.currentHP : battle.challengerStats.currentHP,
            isMyTurn,
            battle.isCompleted,
            battle.winner
        );
    }

    function getIncomingChallenges(address[] calldata _potentialChallengers) public view returns (
        address[] memory challengers,
        uint256[] memory battleIds
    ) {
        uint256 count = 0;
        for (uint i = 0; i < _potentialChallengers.length; i++) {
            if (pendingChallenges[_potentialChallengers[i]][msg.sender] != 0) {
                count++;
            }
        }

        challengers = new address[](count);
        battleIds = new uint256[](count);
        uint256 index = 0;

        for (uint i = 0; i < _potentialChallengers.length; i++) {
            uint256 battleId = pendingChallenges[_potentialChallengers[i]][msg.sender];
            if (battleId != 0) {
                challengers[index] = _potentialChallengers[i];
                battleIds[index] = battleId;
                index++;
            }
        }
    }

    function _startBattle(address player1, address player2, uint256 monsterID1, uint256 monsterID2, uint256 stake, bool isNFTStake) internal {
        uint256 battleId = ++battleNonce;
        
        uint32 player1HP = uint32(BASE_HP + (monsters[monsterID1].defense * 2));
        uint32 player2HP = uint32(BASE_HP + (monsters[monsterID2].defense * 2));
        
        battles[battleId] = Battle({
            challenger: player1,
            opponent: player2,
            challengerMonsterID: uint32(monsterID1),
            opponentMonsterID: uint32(monsterID2),
            stake: stake,
            isNFTStake: isNFTStake,
            lastActionTime: uint32(block.timestamp),
            currentTurn: 0,
            challengerStats: BattleStats({
                currentHP: player1HP,
                maxHP: player1HP,
                criticalHits: 0
            }),
            opponentStats: BattleStats({
                currentHP: player2HP,
                maxHP: player2HP,
                criticalHits: 0
            }),
            isActive: true,
            isCompleted: false,
            winner: address(0),
            secretNumber: 0
        });

        // Handle NFT stakes
        if (isNFTStake) {
            safeTransferFrom(player1, address(this), monsterID1);
            safeTransferFrom(player2, address(this), monsterID2);
        }
        
        emit BattleStarted(battleId, player1, player2);
    }

    // BREEDING FUNCTIONS
    function breedMonsters(uint256 _parent1Id, uint256 _parent2Id) public {
        require(ownerOf(_parent1Id) == msg.sender, "Not owner of parent 1");
        require(ownerOf(_parent2Id) == msg.sender, "Not owner of parent 2");
        require(_parent1Id != _parent2Id, "Cannot breed with self");
        require(_bredTokenIds.current() < MAX_BRED_MONSTERS, "Max bred monsters reached");
        
        Monster storage parent1 = monsters[_parent1Id];
        Monster storage parent2 = monsters[_parent2Id];
        
        require(parent1.isGenesis && parent2.isGenesis, "Both parents must be Genesis monsters");
        
        require(!parent1.hasBreed, "Parent 1 has already bred");
        require(!parent2.hasBreed, "Parent 2 has already bred");
        
        require(block.timestamp >= parent1.breedingCooldown, "Parent 1 is in cooldown");
        require(block.timestamp >= parent2.breedingCooldown, "Parent 2 is in cooldown");
        
        // Create new monster
        _tokenIds.increment();
        uint256 newMonsterId = _tokenIds.current();
        _bredTokenIds.increment();
        
        // Calculate inherited stats (with some randomness)
        uint32 attackStat = uint32(_calculateInheritedStat(parent1.attack, parent2.attack));
        uint32 defenseStat = uint32(_calculateInheritedStat(parent1.defense, parent2.defense));
        uint32 speedStat = uint32(_calculateInheritedStat(parent1.speed, parent2.speed));
        
        monsters[newMonsterId] = Monster({
            attack: attackStat,
            defense: defenseStat,
            speed: speedStat,
            isGenesis: false,
            hasBreed: false,
            parent1Id: uint32(_parent1Id),
            parent2Id: uint32(_parent2Id),
            breedingCooldown: 0
        });
        
        parent1.hasBreed = true;
        parent2.hasBreed = true;
        
        parent1.breedingCooldown = uint32(block.timestamp + BREEDING_COOLDOWN);
        parent2.breedingCooldown = uint32(block.timestamp + BREEDING_COOLDOWN);
        
        _safeMint(msg.sender, newMonsterId);
        
        _allTokens.push(newMonsterId);
        
        emit MonsterBred(newMonsterId, _parent1Id, _parent2Id);
    }

    function _calculateInheritedStat(uint32 stat1, uint32 stat2) internal view returns (uint32) {
        uint32 baseStat = uint32((uint256(stat1) + uint256(stat2)) / 2);
        
        uint256 rand = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            msg.sender,
            "BREED",
            baseStat
        ))) % 21;
        
        int256 variation = int256(rand) - 10;
        
        int256 finalStat;
        if (variation < 0) {
            finalStat = int256(uint256(baseStat)) - (-variation);
        } else {
            finalStat = int256(uint256(baseStat)) + variation;
        }
        
        if (finalStat < 1) return 1;
        if (finalStat > 100) return 100;
        return uint32(uint256(finalStat));
    }

    function _boundStat(uint256 stat) internal pure returns (uint256) {
        if (stat < 1) return 1;
        if (stat > 100) return 100;
        return stat;
    }

    // VIEW FUNCTIONS FOR BREEDING
    function getBreedingInfo(uint256 tokenId) public view returns (
        bool canBreed,
        bool isGenesis,
        bool hasBreedBefore,
        uint256 cooldownEnd,
        uint256 parent1Id,
        uint256 parent2Id
    ) {
        Monster memory monster = monsters[tokenId];
        return (
            monster.isGenesis && !monster.hasBreed && block.timestamp >= monster.breedingCooldown,
            monster.isGenesis,
            monster.hasBreed,
            monster.breedingCooldown,
            monster.parent1Id,
            monster.parent2Id
        );
    }

    function getBattleStats(uint256 battleId) public view returns (
        uint256 challengerHP,
        uint256 opponentHP,
        uint256 challengerCrits,
        uint256 opponentCrits,
        uint256 currentTurn
    ) {
        Battle storage battle = battles[battleId];
        return (
            battle.challengerStats.currentHP,
            battle.opponentStats.currentHP,
            battle.challengerStats.criticalHits,
            battle.opponentStats.criticalHits,
            battle.currentTurn
        );
    }

    function getBattleState(uint256 _battleId) public view returns (
        address challenger,
        address opponent,
        uint256 challengerHP,
        uint256 opponentHP,
        bool isChallenger,
        bool isMyTurn,
        bool isCompleted,
        address winner
    ) {
        Battle storage battle = battles[_battleId];
        bool _isChallenger = (msg.sender == battle.challenger);
        bool _isMyTurn = (battle.currentTurn % 2 == 0 && _isChallenger) || 
                        (battle.currentTurn % 2 == 1 && !_isChallenger);
        
        return (
            battle.challenger,
            battle.opponent,
            battle.challengerStats.currentHP,
            battle.opponentStats.currentHP,
            _isChallenger,
            _isMyTurn,
            battle.isCompleted,
            battle.winner
        );
    }

    function getBattleInfo(uint256 battleId) public view returns (
        address challenger,
        address opponent,
        uint256 challengerMonsterID,
        uint256 opponentMonsterID,
        uint256 stake,
        bool isNFTStake,
        uint256 lastActionTime,
        uint256 currentTurn,
        bool isActive,
        bool isCompleted,
        address winner
    ) {
        Battle storage battle = battles[battleId];
        return (
            battle.challenger,
            battle.opponent,
            battle.challengerMonsterID,
            battle.opponentMonsterID,
            battle.stake,
            battle.isNFTStake,
            battle.lastActionTime,
            battle.currentTurn,
            battle.isActive,
            battle.isCompleted,
            battle.winner
        );
    }

    function canAttack(uint256 battleId) public view returns (
        bool canAct,
        string memory reason
    ) {
        Battle storage battle = battles[battleId];
        bool isChallenger = (msg.sender == battle.challenger);
        
        if (!battle.isActive) {
            return (false, "Battle not active");
        }
        if (battle.isCompleted) {
            return (false, "Battle completed");
        }
        
        bool isPlayerTurn = (battle.currentTurn % 2 == 0 && isChallenger) || 
                           (battle.currentTurn % 2 == 1 && !isChallenger);
        
        return (
            isPlayerTurn,
            isPlayerTurn ? "Can attack" : "Not your turn"
        );
    }

    function checkAndApproveNFT(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner of token");
        require(getApproved(tokenId) != address(this), "Already approved");
        approve(address(this), tokenId);
    }
} 
const { DIFFICULTY, MINE_RATE } = require('../default');

class Block {
  constructor(index, timestamp, transactions, nonce, hash, previousBlockHash) {
    this.index =  index,
    this.timestamp = timestamp,
    this.transactions =  transactions,
    this.nonce =  nonce,
    this.hash =  hash,
    this.previousBlockHash =  previousBlockHash,
    this.difficulty = DIFFICULTY
  }

  adjustDifficulty(lastBlock, currentTime) {
    let { difficulty } = lastBlock;

    difficulty = lastBlock.timestamp + MINE_RATE > currentTime ?
      difficulty + 1 : difficulty - 1;
    return difficulty;
  }

//   toString() {
//     return `Block -
//       Timestamp : ${this.timestamp}
//       Last Hash : ${this.lastHash}
//       Hash      : ${this.hash}
//       Nonce     : ${this.nonce}
//       Difficulty: ${this.difficulty}
//       Data      : ${this.data}`;
//   }

//   static mineBlock(lastBlock, data) {
//     let hash, timestamp;
//     const lastHash = lastBlock.hash;
//     let { difficulty } = lastBlock;
//     let nonce = 0;

//     do {
//       nonce++;
//       timestamp = Date.now();
//       difficulty = Block.adjustDifficulty(lastBlock, timestamp);
//       hash = Block.hash(timestamp, lastHash, data, nonce, difficulty);
//     } while (hash.substring(0, difficulty) !== '0'.repeat(difficulty));

//     return new this(timestamp, lastHash, hash, data, nonce, difficulty);
//   }

//   static hash(timestamp, lastHash, data, nonce, difficulty) {
//     return ChainUtil.hash(`${timestamp}${lastHash}${data}${nonce}${difficulty}`).toString();
//   }

//   static blockHash(block) {
//     const { timestamp, lastHash, data, nonce, difficulty } = block;
//     return Block.hash(timestamp, lastHash, data, nonce, difficulty);
//   }

//   static adjustDifficulty(lastBlock, currentTime) {
//     let { difficulty } = lastBlock;
//     difficulty = lastBlock.timestamp + MINE_RATE > currentTime ?
//       difficulty + 1 : difficulty - 1;
//     return difficulty;
//   }
}

module.exports = Block;
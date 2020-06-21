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
}


module.exports = Block;
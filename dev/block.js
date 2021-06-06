const { DIFFICULTY, MINE_RATE } = require('../default');


//create new block 
// transactions-contain all the transactions which are validated as a part of this blockchain
//nonce - https://en.bitcoin.it/wiki/Nonce used as a reference for the block hash
//difficulty - the number of zeroes in the nonce
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
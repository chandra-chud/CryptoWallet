var Blockchain = require('./blockchain');
const { INITIAL_BALANCE } = require('../default');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');



class Wallet {
  constructor(name) {
    const key = ec.genKeyPair();
    this.signingKey = key;
    this.balance = INITIAL_BALANCE;
    this.name = name;
    //private key is known only to the account owner public key is shared with everyone to accept transactions
    this.privateKey = key.getPrivate('hex');
    this.publicKey = key.getPublic('hex');
  }
}

module.exports = Wallet;
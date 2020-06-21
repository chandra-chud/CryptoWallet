var uuid = require('uuid');
const sha256 = require('sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');


class Transaction {
    constructor(amount, senderKey, recipientKey){
        this.amount = amount,
        this.sender = senderKey,
        this.recipient = recipientKey,
        this.transactionId = uuid.v1().split('-').join(''),
        this.signature = ''
    }

    calculateHash(){
        const dataAsString =  this.sender + this.recipient + this.amount;
        const hash = sha256(JSON.stringify(dataAsString));
        return hash;
    }

    //sign transaction with the privatekey of user
    signTransaction(signingKey) {        
        if (signingKey.getPublic('hex') !== this.sender) {
          throw new Error('You cannot sign transactions for other wallets!');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
    
        this.signature = sig.toDER('hex');
    }

    //check if a particular transaction is valid
    isValid(){
        if(this.sender == '00') 
        return true;
        
        if (this.signature === null || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }


        const publicKey = ec.keyFromPublic(this.sender, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
};

module.exports = Transaction;
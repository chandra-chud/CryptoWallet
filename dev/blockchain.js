const sha256 = require('sha256');
const currentUrl = process.argv[3];
const Block = require('./block');
const Wallet = require('./wallet');
const {DIFFICULTY} = require('../default.js');
const Transaction = require('./transaction');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');


class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.currentNodeUrl = currentUrl;
        this.networkNodes = [];
        this.users = [];
        
        // the genesis block of the blockchain
        this.createNewBlock(100, '0', '0');
    }

    createNewBlock(nonce, previousBlockHash, hash) {
        const newBlock = new Block(this.chain.length+1, Date.now(), this.pendingTransactions, nonce, hash, previousBlockHash);
        this.pendingTransactions = [];

        this.chain.push(newBlock);
        return newBlock;
    }

    createNewWallet(name){
        const newWallet = new Wallet(name);
        const checkUserList = this.users.find(user => user.name === name);

        if(checkUserList != null){
            return null;
        } else {
            return newWallet;
        }
    }
    
    //returns the last block in the blockchain
    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }

    //returns the balance of the user with targetkey equal to the given value
    updateBalanceOfUser (targetKey) {
        var addressTransactions = this.chain[this.chain.length - 1].transactions;
        
        let balance = 0;
        addressTransactions.forEach(transaction => {
            if (transaction.recipient === targetKey) balance += transaction.amount;
            else if (transaction.sender === targetKey) balance -= transaction.amount;
        });

        const currentUser = this.users.find(user => user.publicKey === targetKey);
        const currentBalance = currentUser.balance + balance;

        return currentBalance;
    };

    //creates new transaction by checking the balance
    createNewTransaction(amount, senderKey, recipientKey) {
        var newTransaction;
        const senderExists = this.users.find(user => user.publicKey === senderKey);
        const recipientExists = this.users.find(user => user.publicKey === recipientKey);                

        if(senderKey == '00'){
            newTransaction = new Transaction(amount, senderKey, recipientKey);
        } else if(senderExists && recipientExists){
            const currentBalance = senderExists.balance;

            if(amount > currentBalance){
                newTransaction = {
                    amount: -1,
                    note: 'Insufficient Balance'
                };
            } else {
                newTransaction = new Transaction(amount, senderKey, recipientKey);
                const myKey = ec.keyFromPrivate(senderExists.privateKey);
                newTransaction.signTransaction(myKey);
            }                      
            
        } else {
            newTransaction = {
                amount: -2,
                note: 'The mentioned user keys dont exist create new ones'
            };
        }

        return newTransaction;    
    }

    //checks the validity of the transaction and adds it to the pending transactions array
    addTransactionToPendingTransactions(transactionObj) {
        if(!transactionObj.isValid()){
            throw new Error('Transaction InValid');
        }

        this.pendingTransactions.push(transactionObj);
        return this.getLastBlock()['index'] + 1;
    } 

    
    hashBlock(previousBlockHash, currentBlockData, nonce) {
        const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
        const hash = sha256(dataAsString);
        return hash;
    };

    
    //used to calculate nonce of the block using default difficulty levels
    proofOfWork(previousBlockHash, currentBlockData) {
        let nonce = 0;
        let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        
        while (hash.substring(0, DIFFICULTY) !== '0000') {
            nonce++;
            hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
        }
    
        return nonce;
    };


    //checks if the chain is valid or anything is been tampered with
    chainIsValid(blockchain) {
        let validChain = true;
    
        for (var i = 1; i < blockchain.length; i++) {
            const currentBlock = blockchain[i];
            const prevBlock = blockchain[i - 1];
            const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);

            if (blockHash.substring(0, 4) !== '0000') 
            validChain = false;

            if (currentBlock['previousBlockHash'] !== prevBlock['hash']) 
            validChain = false;
        };
    
        const genesisBlock = blockchain[0];
        const correctNonce = genesisBlock['nonce'] === 100;

        const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
        const correctHash = genesisBlock['hash'] === '0';
        const correctTransactions = genesisBlock['transactions'].length === 0;
    
        if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTransactions) validChain = false;
    
        return validChain;
    };


    getBlock (blockHash) {
        let correctBlock = null;
        
        this.chain.forEach(block => {
            if (block.hash === blockHash) correctBlock = block;
        });

        return correctBlock;
    };
    
    
    getTransaction (transactionId) {
        let correctTransaction = null;
        let correctBlock = null;
    
        this.chain.forEach(block => {
            block.transactions.forEach(transaction => {
                if (transaction.transactionId === transactionId) {
                    correctTransaction = transaction;
                    correctBlock = block;
                };
            });
        });
        

        return {
            transaction: correctTransaction,
            block: correctBlock
        };
    };
};

module.exports = Blockchain;











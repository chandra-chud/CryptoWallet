var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Blockchain = require('./blockchain');
var Block = require('./block');
var uuid = require('uuid');
var port = process.argv[2];
var nodeAddress = uuid.v1().split('-').join('');
var bitcoin = new Blockchain();
var Transaction = require('./transaction');
var rp = require('request-promise');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb',extended: false }));


//get the blockchain
app.get('/blockchain', (req, res) => {
    res.send(bitcoin);
});

//get all users
app.get('/all-users', (req, res) => {
    res.send(bitcoin.users);
});

app.post('/new-user-data', (req, res) => {
	bitcoin.users = req.body;
	res.json({note : 'user data changed'});	
});

app.get('/users-change', (req, res) => {
	const requestPromises = [];
	
	bitcoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/new-user-data',
			method: 'POST',
			body: bitcoin.users,
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		res.json({ note: 'User data changed and broadcast successfully.' });	
	});
	
});

//to create a new transaction and get the public and private keys
app.post('/new-user', (req, res) => {
	const newUser = bitcoin.createNewWallet(req.body.name);
	
	if(newUser){
		bitcoin.users.push(newUser);

		const requestPromises = [];

		const requestOptions = {
			uri: bitcoin.currentNodeUrl + '/users-change',
            method: 'GET',
			json: true
		};

		requestPromises.push(rp(requestOptions));

		Promise.all(requestPromises)
		.then(dafa => {
			res.json({
				note:'User successfully created',
				data: newUser
			});
		});

	} else {
		res.json({
			note:'User already exists choose a different name',
			data: null
		})
	}
});


//to add a transaction to the current block
app.post('/transaction', (req, res) => {
    const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
	const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);

    res.json({ note: `Transaction will be added in block ${blockIndex}.` });
});


//to add a transaction to the all blocks in the network
app.post('/transaction/broadcast', function(req, res) {
	const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
	console.log(newTransaction);

	if(newTransaction.amount < 0){
		res.json({ note: newTransaction.note });
	} else {
		if(newTransaction.sender == "00"){
			bitcoin.addTransactionToPendingTransactions(newTransaction);
			const requestPromises = [];
	
			bitcoin.networkNodes.forEach(networkNodeUrl => {
				const requestOptions = {
					uri: networkNodeUrl + '/transaction',
					method: 'POST',
					body: {
						amount: newTransaction.amount,
						sender: newTransaction.sender,
						recipient: newTransaction.recipient
					},
					json: true
				};
		
				requestPromises.push(rp(requestOptions));
			});
		
			Promise.all(requestPromises)
			.then(data => {
				res.json({ note: 'Miner Transaction created and broadcast successfully.' });
			});		
		} else {
			const verifyTransaction = bitcoin.pendingTransactions.find(element => element.sender == req.body.sender);

			if(verifyTransaction){
				res.json({note: 'The sender already has transaction lined up please wait till its over'});
			} else {
				bitcoin.addTransactionToPendingTransactions(newTransaction);
				const requestPromises = [];
		
				bitcoin.networkNodes.forEach(networkNodeUrl => {
					const requestOptions = {
						uri: networkNodeUrl + '/transaction',
						method: 'POST',
						body: newTransaction,
						json: true
					};
			
					requestPromises.push(rp(requestOptions));
				});
			
				Promise.all(requestPromises)
				.then(data => {
					res.json({ note: 'Transaction created and broadcast successfully.' });
				});		
			}	
		}
	}
});

//to mine a new block
app.post('/mine', (req, res) => {
	var minerId = req.body.minerId;
	
	var lastBlock = bitcoin.getLastBlock();
    var previousBlockHash = lastBlock['hash'];
    var currentBlockData = {
        'transactions':bitcoin.pendingTransactions,
        'index': lastBlock['index'] + 1
    };

    var nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    var blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);    
    var newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);
	var requestPromises = [];
	
	bitcoin.users.forEach(userWallet => {
		userWallet.balance = bitcoin.updateBalanceOfUser(userWallet.publicKey);
	});

    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: {newBlock: newBlock},
            json: true
        };

        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
    .then(data => {
        const requestOptions = {
			uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
            method: 'POST',

			//reward transaction for the miner
			body: {
				amount: 20,
				sender: "00",
				recipient: minerId
			},
			json: true
		};

		return rp(requestOptions);
    }).then(data => {
		const requestOptions = {
			uri: bitcoin.currentNodeUrl + '/users-change',
            method: 'GET',
			json: true
		};

		return rp(requestOptions);
	});


    res.json({
        note:"new block mined and broadcasted successfully",
        block: newBlock
    });
});


app.post('/receive-new-block', function(req, res) {
	const newBlock = req.body.newBlock;
	const lastBlock = bitcoin.getLastBlock();
	const correctHash = lastBlock.hash === newBlock.previousBlockHash; 
	const correctIndex = lastBlock['index'] + 1 === newBlock['index'];

	if (correctHash && correctIndex) {
		bitcoin.chain.push(newBlock);

		bitcoin.pendingTransactions = [];
		res.json({
			note: 'New block received and accepted.',
			newBlock: newBlock
		});
	} else {
		res.json({
			note: 'New block rejected.',
			newBlock: newBlock
		});
	}
});



// register a node and broadcast it the network
app.post('/register-and-broadcast-node', function(req, res) {
	const newNodeUrl = req.body.newNodeUrl;
	if (bitcoin.networkNodes.indexOf(newNodeUrl) === -1) bitcoin.networkNodes.push(newNodeUrl);

	const regNodesPromises = [];
	bitcoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/register-node',
			method: 'POST',
			body: { newNodeUrl: newNodeUrl },
			json: true
		};

		regNodesPromises.push(rp(requestOptions));
	});

	Promise.all(regNodesPromises)
	.then(data => {
		const bulkRegisterOptions = {
			uri: newNodeUrl + '/register-nodes-bulk',
			method: 'POST',
			body: { allNetworkNodes: [ ...bitcoin.networkNodes, bitcoin.currentNodeUrl ] },
			json: true
		};

		return rp(bulkRegisterOptions);
	})
	.then(data => {
		res.json({ note: 'New node registered with network successfully.' });
	});
});


// register a node with the network
app.post('/register-node', function(req, res) {
    const newNodeUrl = req.body.newNodeUrl;

    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) === -1;
	const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;

    if (nodeNotAlreadyPresent && notCurrentNode) 
    bitcoin.networkNodes.push(newNodeUrl);

    res.json({ note: 'New node registered successfully.' });
});


// register multiple nodes at once
app.post('/register-nodes-bulk', function(req, res) {
	const allNetworkNodes = req.body.allNetworkNodes;
	allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) === -1;
        const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;
        
		if (nodeNotAlreadyPresent && notCurrentNode) bitcoin.networkNodes.push(networkNodeUrl);
	});

	res.json({ note: 'Bulk registration successful.....' });
});


//to check if a blockchain is valid and using the longest length policy to choose the correct chain
app.get('/consensus', function(req, res) {
	const requestPromises = [];
	bitcoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/blockchain',
			method: 'GET',
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(blockchains => {
		const currentChainLength = bitcoin.chain.length;
		let maxChainLength = currentChainLength;
		let newLongestChain = null;
		let newPendingTransactions = null;

		blockchains.forEach(blockchain => {
			if (blockchain.chain.length > maxChainLength) {
				maxChainLength = blockchain.chain.length;
				newLongestChain = blockchain.chain;
				newPendingTransactions = blockchain.pendingTransactions;
			};
		});


		if (!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))) {
			res.json({
				note: 'Current chain has not been replaced.',
				chain: bitcoin.chain
			});
		}
		else {
			bitcoin.chain = newLongestChain;
			bitcoin.pendingTransactions = newPendingTransactions;
			res.json({
				note: 'This chain has been replaced.',
				chain: bitcoin.chain
			});
		}
	});
});


// get block by blockHash
app.get('/block/:blockHash', function(req, res) { 
	const blockHash = req.params.blockHash;
	const correctBlock = bitcoin.getBlock(blockHash);

    res.json({
		block: correctBlock
	});
});


// get transaction by transactionId
app.get('/transaction/:transactionId', function(req, res) {
	const transactionId = req.params.transactionId;
	const transactionData = bitcoin.getTransaction(transactionId);
	
	//console.log(transactionData);
    res.json({
		transaction: transactionData.transaction,
		block: transactionData.block
	});
});


// get address by address
app.get('/address/:address', function(req, res) {
	const address = req.params.address;
	const addressData = bitcoin.getAddressData(address);

    res.json({
		addressData: addressData
	});
});


app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
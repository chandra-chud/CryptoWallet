# CryptoWallet
A digital wallet implemented in JavaScript using Blockchain

## Technologies Used

 - NodeJS
 - ExpressJS
 - JavaScript

 ## Features
 
 - Block-chain implementation using JavaScript
 - Data hashed and stored in a block
 - Nonce aka Proof Of Work
 - Multiple network nodes in the blockchain, with synchronization
 - Wallet for Each user with private and public Key
 - Reward transaction for miners

 ## How To Use
- Now run the following commands 
```
   npm cache clean
   npm install
```

- Now, you should be able to see the node modules folder with all dependencies installed.
- Run each one of the five network nodes in different terminal windows simultaneously using the command
```
   npm run node_i (i => 1..5)
```
- Import the json file for postman into your Postman Desktop App this contains API preadded with body format to create the blockchain

## Application User Manual
Check if all node servers are running in the terminal
- **Register Node** : Register the nodes using `/register-and-broadcast-node` endpoints by entering the local host website link in the post request
- **Create Wallet** : Create new user wallets using `/new-user` endpoints
- **Adding Transactions**: In the `/transaction/broadcast` endpoint enter the amount and sender,recipients public keys
- **Mine Blocks** : After adding transactions we need to mine them using`/mine` to validate them for this you need to provide one of the users as a miner and provide his public keys in minerId
-  **Consensus** : When you add a new node  and it is out of sync with the blockchain you need to perform consensus using `/consensus` to get it into sync




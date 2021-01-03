var Blockchain = require('./blockchain.js')

var bitcoin = new Blockchain();

console.log(bitcoin.verifyBlock(0))
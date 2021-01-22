var sha256 = require('sha256')
var uuid = require('uuid');
var url = process.argv[3]

function Blockchain(){
	this.chain = [];
	this.memPool = [];
	this.generateGenesis(); /// Creates Genesis Block only once
	this.currentNodeURL = url
	this.networkNodes = [];
	this.nodeAddress = uuid.v4().split('-').join('')
}

Blockchain.prototype.generateGenesis = function(){
	var block = {
		'height': 0,
		'timestamp':'1610783475068',
		'transactions':[],
		'previousHash':'0',
		'hash':'0',
		'nonce':'100'
	}
	this.chain.push(block)
	this.memPool = [];
	console.log('Genesis Block Created ')
	return block;	
}

Blockchain.prototype.createNewBlock = function() {
	if(this.chain.length == 0){
		previousHash = null
	}else{
		previousHash = this.chain[this.chain.length-1].hash;
	}
	var nonce = this.proofOfWork(previousHash,this.memPool)
	var hash = this.blockHashing(previousHash,this.memPool,nonce)
	var block = {
		'height': this.chain.length,
		'timestamp':Date.now(),
		'transactions':this.memPool,
		'previousHash':previousHash,
		'hash':hash,
		'nonce':nonce
	}
	this.chain.push(block)
	this.memPool = [];
	console.log('New Block Added with block height '+block.height)
	return block;
};

Blockchain.prototype.blockHashing = function(previousHash,blockData,nonce){
	blockString = previousHash + JSON.stringify(blockData) + nonce;
	return sha256(blockString);
}

Blockchain.prototype.proofOfWork = function(previousHash,blockData){
	var nonce = 0;
	var hash = this.blockHashing(previousHash,blockData,nonce);
	while(hash.substring(0,4) != '0000'){
		nonce++
		hash = this.blockHashing(previousHash,blockData,nonce);
		//console.log(hash)
	}
	return nonce;
}

Blockchain.prototype.verifyBlock = function(height){
	var block = this.chain[height];
	var hash = this.blockHashing(block.previousHash,block.transactions,block.nonce);
	if(hash == block.hash){
		return true
	}else{
		return false;
	}
}

Blockchain.prototype.getLastBlock = function (){
	var index = this.chain.length
	return this.chain[index-1];
}

Blockchain.prototype.createNewTx = function(amount,sender,receiver){
	var tx = {
		'timestamp':Date.now(),
		'amount':amount,
		'receiver':receiver,
		'sender':sender,
		'txHash':uuid.v4().split('-').join('')
	}
	return tx;
}

Blockchain.prototype.addTxToMemPool = function(txData){
	this.memPool.push(txData);
	return 'tx Added';
}


Blockchain.prototype.getTxsOfBlock = function(height) {
	var block = this.chain[height]
	if(block){
		return block.transactions;
	}else{
		return 'Block Not Found';
	}
	
};

Blockchain.prototype.chainIsValid = function(blockchain){
	var validChain = true;
	for (var i = 1; i < blockchain.length; i++) {
		if(blockchain[i].height != i) validChain = false;
		if(blockchain[i-1].hash != blockchain[i].previousHash) validChain = false;
		if(this.blockHashing(blockchain[i].previousHash,blockchain[i].transactions,blockchain[i].nonce) != blockchain[i].hash) validChain = false;
	}
	if(blockchain[0].hash != '0' || blockchain[0].previousHash != '0' || blockchain[0].nonce != '100'){
		validChain = false;
	}
	return validChain
}
module.exports = Blockchain;
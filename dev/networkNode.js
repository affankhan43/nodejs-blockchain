/*
	Blockchain prototype from scratch in nodejs
	Author: Affan Ahmed Khan
	File: networkNodes.js (API Routes)
*/

var express = require('express')
var bodyParser  = require('body-parser')
var morgan = require('morgan')
var Blockchain = require('./blockchain')
var request = require('request');
var fetch = require('node-fetch');

var nodePort = process.argv[2]
console.log(nodePort)


var blockchain = new Blockchain();

var app  = express();
app.use(bodyParser.json())
app.use(morgan('dev'))

//Fetch Complete Blockchain
app.get('/blockchain',(req,res)=>{
	res.json(blockchain)
})


//Broadcast new Transaction
app.post('/txAndBroadcast',(req,res)=>{
	// if clauses
	var txData = blockchain.createNewTx(req.body.amount,req.body.sender,req.body.receiver)
	blockchain.addTxToMemPool(txData)
	//broadcasting to all networknodes
	var promises = [];
	blockchain.networkNodes.forEach((nodeurl)=>{
		var apiRequest2 = {
			method:'POST',
			uri:nodeurl+'/addTx',
			body:{tx:txData},
			json:true
		}
		promises.push(request(apiRequest2))
	})
	Promise.all(promises).then((data)=>{
		res.json({"msg":"Txs Broadcast Successfully"})
	})
})

//endpoint for receiving new transactions
app.post('/addTx',(req,res)=>{
	var txData = req.body.tx
	blockchain.addTxToMemPool(txData)
	console.log("New Transaction Received")
	res.json({"msg":"New Transaction Received"})

})

//Mine new block and broadcast to the network
app.get('/mineAndBroadcast',(req,res)=>{
	var block = blockchain.createNewBlock();
	var reward = blockchain.createNewTx(12,"00000",blockchain.nodeAddress)
	blockchain.addTxToMemPool(reward)
	//broadcasting block to all networknodes
	var promises = [];
	blockchain.networkNodes.forEach((nodeurl)=>{
		var apiRequest2 = {
			method:'POST',
			uri:nodeurl+'/receive-new-block',
			body:{blockData:block},
			json:true
		}
		promises.push(request(apiRequest2))
	})
	Promise.all(promises).then((data)=>{
		//broadcasting reward transaction to all networknodes
		var promises2 = [];
		blockchain.networkNodes.forEach((nodeurl)=>{
			var apiRequest2 = {
				method:'POST',
				uri:nodeurl+'/addTx',
				body:{tx:reward},
				json:true
			}
			promises2.push(request(apiRequest2))
		})
		Promise.all(promises2).then((data)=>{
			res.json({"msg":"Block Mined and Broadcast Successfully"})
		})
		
	})
	res.json({'success':true,'msg':'Block Mined Successfully','block':block})
})

//endpoint for receiving new blocks
app.post('/receive-new-block',(req,res)=>{
	var block = req.body.blockData;
	var index = blockchain.chain.length;
	var latest = blockchain.chain[index-1];
	if(latest.hash == block.previousHash && index == block.height ){
		blockchain.chain.push(block)
		blockchain.memPool = []
		res.json({"msg":"New Block Received"})
	}else{
		res.json({"msg":"Block Rejected"})
	}
})

app.post('/register-node',(req,res)=>{
	var newNetworkNode = req.body.newNodeUrl
	if(blockchain.networkNodes.indexOf(newNetworkNode) == -1 && newNetworkNode != blockchain.currentNodeURL){
		blockchain.networkNodes.push(newNetworkNode)
		res.json({"msg":"Node Registered Successfully"});
	}else{
		res.json({"msg":"Registeration Failed"})
	}
})

app.post('/register-node-bulk',(req,res)=>{
	var bulkNodes = req.body.bulkNodes;
	bulkNodes.forEach((nodeUrl,index)=>{
		if(blockchain.networkNodes.indexOf(nodeUrl) == -1 && nodeUrl != blockchain.currentNodeURL){
			blockchain.networkNodes.push(nodeUrl)
		}
	})
	res.json({"msg":"Bulk Registration Done!"})
})

app.post('/register-and-broadcast',(req,res)=>{
	var newNodeURL = req.body.newNodeurl;
	if(blockchain.networkNodes.indexOf(newNodeURL) == -1 && newNodeURL != blockchain.currentNodeURL){
		blockchain.networkNodes.push(newNodeURL)
		var promises = [];
		blockchain.networkNodes.forEach((nodeurl)=>{
			var apiRequest2 = {
				method:'POST',
				url:nodeurl+'/register-node-bulk',
				body:{bulkNodes:[...blockchain.networkNodes,blockchain.currentNodeURL]},
				json:true
			}
			promises.push(request(apiRequest2))
		})
		Promise.all(promises).then((data)=>{
			res.json({"msg":"Nodes Broadcast Successfully"})
		})

	}else{
		res.json({"msg":"Registeration Failed"})
	}

})

app.post('/consensus', (req,res)=>{
	var promises = [];
	blockchain.networkNodes.forEach(nodeurl =>{
		var fetch1 = fetch(nodeurl+'/blockchain').then(data=>data.json())
		promises.push(fetch1)
 	})
	Promise.all(promises).then((blockchains) =>{
		var currentLongestChainLength = blockchain.chain.length;
		var longestChain = null
		var updatedMempool = null
		blockchains.forEach((item)=>{
			if(item.chain.length > currentLongestChainLength){
				if(blockchain.chainIsValid(item.chain)){
					longestChain = item.chain;
					updatedMempool = item.mempool;
					currentLongestChainLength = item.chain.length
				}
			}
		})
		if(longestChain){
			blockchain.chain = longestChain
			blockchain.memPool = updatedMempool
			res.json({"msg":"Blockchain Updated Successfully"})
 		}
 		else{
 			res.json({"msg":"Your Blockchain is already upto date!!"})
 		}
	})
});

app.listen(nodePort,()=>{
	console.log('Server Started port listening on '+ nodePort)
})


/* Block Explorer

Routes
* /block  -> get all blocks (timestamp,hash)
* /block/:height  -> get blocks by height
* /block/:hash    -> get blocks by hash
* /txs -> get all txs
* /tx/:txhash     -> get specific tx data by tx hash
* /address/:address  -> get txs by having address in receiver or sender

*/
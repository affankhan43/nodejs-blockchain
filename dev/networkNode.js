var express = require('express')
var bodyParser  = require('body-parser')
var morgan = require('morgan')
var Blockchain = require('./blockchain')
var request = require('request');

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
	var txData = blockchain.createNewTx(req.body.amount,req.body.sender,req.body.receiver)
	blockchain.addTxToMemPool(txData)
	var promises = [];
	blockchain.networkNodes.forEach((nodeurl)=>{
		var apiRequest2 = {
			method:'POST',
			url:nodeurl+'/addTx',
			body:{txData:txData},
			json:true
		}
		promises.push(request(apiRequest2))
	})
	Promise.all(promises).then((data)=>{
		res.json({"msg":"Nodes Broadcast Successfully"})
	})

})

app.post('/addTx',(req,res)=>{
	var txData = req.body.txData
	blockchain.addTxToMemPool(txData)
	console.log("New Transaction Received")
	res.json({"msg":"New Transaction Received"})

})
// app.post('/generateTx',(req,res)=>{
//  console.log(req.body)
//  var tx  = blockchain.createNewTx(req.body.amount,req.body.sender,req.body.receiver)
//  res.json({"success":true,"message":"Tx added in mempool will be add in blockheigh "+blockchain.chain.length,'tx':tx})
// })

app.get('/mine',(req,res)=>{
	var block = blockchain.createNewBlock();
	res.json({'success':true,'msg':'Block Mined Successfully','block':block})
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

app.listen(nodePort,()=>{
	console.log('Server Started port listening on '+ nodePort)
})

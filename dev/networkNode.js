var express = require('express')
var bodyParser  = require('body-parser')
var morgan = require('morgan')
var Blockchain = require('./blockchain')

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
app.post('/generateTx',(req,res)=>{
 console.log(req.body)
 var tx  = blockchain.createNewTx(req.body.amount,req.body.sender,req.body.receiver)
 res.json({"success":true,"message":"Tx added in mempool will be add in blockheigh "+blockchain.chain.length,'tx':tx})
})

app.get('/mine',(req,res)=>{
	var block = blockchain.createNewBlock();
	res.json({'success':true,'msg':'Block Mined Successfully','block':block})
})

app.post('/register-node',(req,res)=>{

})


app.listen(nodePort,()=>{
	console.log('Server Started port listening on '+ nodePort)
})

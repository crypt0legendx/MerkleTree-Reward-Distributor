const fs = require("fs");
const MerkleTree = require('./Library/MerkleTree');
const Web3 =  require('web3');
const { soliditySha3 } = require("web3-utils");
require('dotenv').config();

// const TokenABI = require('./abis/ABI_Token.json');
const DistributorABI = require('./abis/ABI_Distributor.json');

const web3 = new Web3(process.env.INFURA_URL);
const distributorContract = new web3.eth.Contract(
  DistributorABI,
  process.env.DISTRIBUTOR_ADDRESS//distributor contract address    
);


const  main = async()=>{
    let rewardDistribution;
    let distributions;
    let privateKeys;
    let leafNodes = [];
    try {
        const jsonString = fs.readFileSync("./dummies/rewardDistribution2.json");
        rewardDistribution = JSON.parse(jsonString);
      } catch (err) {
        console.log(err);
        return;
      }
      distributions = rewardDistribution.distribution;
      privateKeys = rewardDistribution.privateKeys;

      distributions =  distributions.map((v,i)=>{
          const newV = v;
          newV.amount = parseInt(v.amount.hex, 16);
          return newV;
      })

      for(let i = 0; i< distributions.length; i++){
          leafNodes.push(soliditySha3(distributions[i].index,distributions[i].address,distributions[i].amount));
      }

      const tree = new MerkleTree(leafNodes, soliditySha3);
      const root = tree.getRoot();
      //get proof of index 0 
      const leaf = soliditySha3(distributions[0].index,distributions[0].address,distributions[0].amount);
      const {proof, leftDirection} = tree.getProofAndDirection(leaf);
      // console.log('distributions');
      // console.log(distributions);
      console.log('Leaves');
      console.log(leafNodes);
      console.log('Merkle Root');
      console.log(root);
      console.log('Current Leaf');
      console.log(leaf);
      console.log('Proof');
      console.log(proof);
      console.log('Direction');
      console.log(leftDirection);
      console.log('verify');
      console.log(tree.verify(proof,leftDirection, leaf, root));

      //get basic info of contract on testnet
      console.log('check claimed');
      const claimed = await distributorContract.methods.isClaimed(0).call();
      console.log(`Check Index0 is claimed: ${claimed}`);
      //code to make transactions on testnet to claim rewards
      
      if(!claimed){
        console.log('make claim transaction');      
        const tx = distributorContract.methods.claim(distributions[0].index,distributions[0].address,BigInt(distributions[0].amount), proof, leftDirection);
        const gas = await tx.estimateGas({from: process.env.ADDRESS});
        const gasPrice = await web3.eth.getGasPrice();
        const data = tx.encodeABI();
        const nonce = await web3.eth.getTransactionCount(process.env.ADDRESS);
        const signedTx = await web3.eth.accounts.signTransaction(
          {
            to: process.env.DISTRIBUTOR_ADDRESS, 
            data,
            gas,
            gasPrice,
            nonce, 
            chainId: 4
          },
          process.env.PRIVATE_KEY
        );
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        console.log(`Transaction hash: ${receipt.transactionHash}`);
      }
      
      
}


main();
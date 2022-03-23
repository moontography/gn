// import assert from 'assert'
const assert = require('assert')
// import dotenv from 'dotenv'
const dotenv = require('dotenv')
// import fs from 'fs'
const fs = require('fs')
// import path from 'path'
const path = require('path')
// import Web3 from 'web3'
const Web3 = require('web3')
// import parse from 'csv-parse'
const { parse } = require('csv-parse')

// Initialize environment variables
dotenv.config()
;(async function seed() {
  assert(process.env.PRIVATE_KEY, 'wallet key not provided')
  assert(process.env.HTTP_PROVIDER_URL, 'RPC node not provided') // https://mainnet.infura.io/v3/%API_KEY%
  assert(process.env.SWAP_CONTRACT, 'swap contract not provided')

  const seedAmount = parseInt(process.env.SEED_AMOUNT || 500)
  const startIndex = parseInt(process.env.START || 0)

  const csvPath = path.join(__dirname, '..', 'v1_balances.csv')

  const web3 = new Web3(
    new Web3.providers.HttpProvider(process.env.HTTP_PROVIDER_URL)
  )

  const account = web3.eth.accounts.privateKeyToAccount(
    `0x${process.env.PRIVATE_KEY}`
  )
  web3.eth.accounts.wallet.add(account)
  web3.eth.defaultAccount = account.address

  const data = await parseCsv(csvPath)
  const filteredData = data.slice(startIndex, startIndex + seedAmount)
  const wallets = filteredData.map((d) => d.Address)
  const amounts = filteredData.map((d) => d.Balance)

  const swapContract = GNSwap(web3, process.env.SWAP_CONTRACT)
  const seedTxn = swapContract.methods.setBalances(wallets, amounts)
  const gas = await seedTxn.estimateGas()
  await seedTxn.send({ from: web3.eth.defaultAccount, gas })

  console.log(
    `Successfully seeded ${wallets.length} wallets starting at index ${startIndex}!`
  )
})()

async function parseCsv(filePath, hasColumns = true) {
  return await new Promise((resolve, reject) => {
    let rows = []
    const parser = parse({ columns: hasColumns })
    parser.on('readable', () => {
      let record
      while ((record = parser.read())) {
        rows.push(record)
      }
    })
    parser.on('error', reject)
    parser.on('end', () => resolve(rows))
    fs.createReadStream(filePath).pipe(parser)
  })
}

function GNSwap(web3, contractAddy) {
  const abi = [
    {
      inputs: [
        {
          internalType: 'address',
          name: '_v1',
          type: 'address',
        },
        {
          internalType: 'address',
          name: '_v2',
          type: 'address',
        },
      ],
      stateMutability: 'nonpayable',
      type: 'constructor',
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: 'address',
          name: 'previousOwner',
          type: 'address',
        },
        {
          indexed: true,
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'OwnershipTransferred',
      type: 'event',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_user',
          type: 'address',
        },
      ],
      name: 'getV2Amount',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'owner',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'renounceOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address[]',
          name: '_users',
          type: 'address[]',
        },
        {
          internalType: 'uint256[]',
          name: '_v1Balances',
          type: 'uint256[]',
        },
      ],
      name: 'setBalances',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_wallet',
          type: 'address',
        },
        {
          internalType: 'bool',
          name: '_swapped',
          type: 'bool',
        },
      ],
      name: 'setSwapped',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'swap',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      name: 'swapped',
      outputs: [
        {
          internalType: 'bool',
          name: '',
          type: 'bool',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: 'newOwner',
          type: 'address',
        },
      ],
      name: 'transferOwnership',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'v1',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      name: 'v1Balances',
      outputs: [
        {
          internalType: 'uint256',
          name: '',
          type: 'uint256',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'v2',
      outputs: [
        {
          internalType: 'address',
          name: '',
          type: 'address',
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [
        {
          internalType: 'address',
          name: '_tokenAddy',
          type: 'address',
        },
        {
          internalType: 'uint256',
          name: '_amount',
          type: 'uint256',
        },
      ],
      name: 'withdrawTokens',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ]

  return new web3.eth.Contract(abi, contractAddy)
}

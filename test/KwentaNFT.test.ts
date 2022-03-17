/* External imports */
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { ContractReceipt, ContractTransaction, utils } from 'ethers'
import { Wallet } from '@ethersproject/wallet'
import { Signer } from '@ethersproject/abstract-signer'
import { JsonRpcProvider } from '@ethersproject/providers'
import 'dotenv/config'

/* Internal imports */
import { KwentaNFT } from '../typechain/KwentaNFT'
import recipientPrivateKeys from '../recipientPrivateKeys.json'


describe(`KwentaNFT (on Optimism)`, () => {
  const uri = 'https://ipfs/<SAMPLE_URI>/'
  const infuraRinkebyUrl = 'https://rinkeby.infura.io/v3/'

  let receipt: ContractReceipt,
    mintTx0: ContractTransaction,
    KwentaNFT: KwentaNFT,
    deployedCtc,
    provider = new ethers.providers.JsonRpcProvider(
      infuraRinkebyUrl + process.env.INFURA_API_KEY
    ),
    owner: Wallet,
    l2Wallets: Wallet[] = []

  describe(`distribute()`, () => {
    before(`distribute()`, async () => {
      // Create list of test recipients
      const privKeys: string[] = recipientPrivateKeys.keys

      for (let i = 0; i < 206; i++) {
        const privKey = privKeys[i]
        const l2Wallet = new ethers.Wallet(privKey, provider)

        l2Wallets.push(l2Wallet)
      }

      // Create owner account
      const ownerPrivKey = process.env.PRIVATE_KEY as string

      owner = new ethers.Wallet(ownerPrivKey, provider)

      const Factory__KwentaNFT = await ethers.getContractFactory('KwentaNFT')

      KwentaNFT = await Factory__KwentaNFT.connect(owner).deploy(uri) as KwentaNFT
      KwentaNFT.deployed()

      console.log(`\n KwentaNFT contract address: ${KwentaNFT.address} \n`)
      // receipt = await mintTx0.wait()

      deployedCtc = await KwentaNFT.deployTransaction.wait()

      console.log(
        `\n Gas used to deploy: ${deployedCtc.gasUsed.toString()} gas \n`
      )
    })

    it(`should get the uri for tier0 tokenIds`, async () => {
      for (let tokenId = 1; tokenId < 101; tokenId++) {
        let uri_ = await KwentaNFT.connect(owner).uri(tokenId)
        if (tokenId < 101) expect(uri_).to.eq(uri + 'tier0.json')
      }
    })

    it(`should get the uri for tier1 tokenIds`, async () => {
      for (let tokenId = 101; tokenId < 151; tokenId++) {
        let uri_ = await KwentaNFT.connect(owner).uri(tokenId)
        if (tokenId > 100 && tokenId < 151) expect(uri_).to.eq(uri + 'tier1.json')
      }
    })

    it(`should get the uri for tier2 tokenIds`, async () => {
      for (let tokenId = 151; tokenId < 201; tokenId++) {
        let uri_ = await KwentaNFT.connect(owner).uri(tokenId)
        if (tokenId > 150 && tokenId < 201) expect(uri_).to.eq(uri + 'tier2.json')
      }
    })

    it(`should get the uri for tier3 tokenIds`, async () => {
      for (let tokenId = 201; tokenId < 207; tokenId++) {
        let uri_ = await KwentaNFT.connect(owner).uri(tokenId)
        if (tokenId > 200 && tokenId < 207) expect(uri_).to.eq(uri + 'tier3.json')
      }
    })

    it(`should get the uri for outOfRange tokenIds`, async () => {
      let uri_

      for (let tokenId = 206; tokenId < 210; tokenId++) {
        uri_ = await KwentaNFT.connect(owner).uri(tokenId)

        if (tokenId > 206) console.log('Should return outOfRange error: ', uri_)
      }
    })

    it(`should have distributed`, async () => {
      let _to: any = [],
        distributeTx

      l2Wallets.forEach((l2Wallet: Wallet) => {
        _to.push(l2Wallet.address)
      })

      distributeTx = await KwentaNFT.connect(owner).distribute(_to)

      const hasDistributed_ = await KwentaNFT.hasDistributed()
      console.log(`\n hasDistributed bool state var: ${hasDistributed_} \n`)

      // 1. Confirm that the `hasDistributed` state var has changed
      expect(hasDistributed_).eq(true)

      // // 2. Confirm that the 206 recipients each recieved 1 KwentaNFT
      // for (let tokenId = 0; tokenId < _to.length; tokenId++) {
      //   // 2a. Confirm that tokens were distributed by tier
      //   const tier0 = tokenId < 101
      //   const tier1 = tokenId > 100 && tokenId < 151
      //   const tier2 = tokenId > 150 && tokenId < 201
      //   const tier3 = tokenId > 200 && tokenId < 207
      //   const outOfRange = tokenId > 206

      //   let balance

      //   if (tier0) balance = await KwentaNFT.balanceOf(_to, 0)
      //   if (tier1) balance = await KwentaNFT.balanceOf(_to, 1)
      //   if (tier2) balance = await KwentaNFT.balanceOf(_to, 2)
      //   if (tier3) balance = await KwentaNFT.balanceOf(_to, 3)

      //   if (outOfRange) console.log('This should result in an error!')

      //   if (balance) expect(balance.toNumber()).to.eq(1)
      // }
    })

    describe(`getTokenIDByTier(...)`, () => {
      it(`should get tier `, async () => {
        const tier0 = await KwentaNFT.connect(owner).getTierByTokenID(1)
        const tier1 = await KwentaNFT.connect(owner).getTierByTokenID(101)
        const tier2 = await KwentaNFT.connect(owner).getTierByTokenID(151)
        const tier3 = await KwentaNFT.connect(owner).getTierByTokenID(201)

        expect(tier0.toNumber()).to.eq(0)
        expect(tier1.toNumber()).to.eq(1)
        expect(tier2.toNumber()).to.eq(2)
        expect(tier3.toNumber()).to.eq(3)
      })
    })

    describe(`disableMint(...)`, () => {
      it(`should disable minting `, async () => {
        await KwentaNFT.connect(owner).disableMint()
        const isMintDisabled = await KwentaNFT.connect(owner).isMintDisabled()

        expect(isMintDisabled).to.eq(true)
      })
    })
  })
})
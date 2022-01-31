import { ethers } from "ethers";
import Web3 from "web3";
import { XDVNFT__factory } from "./types/ethers-contracts";
import { AnconProtocol__factory } from "./types/ethers-contracts/factories/AnconProtocol__factory";
const AnconToken = require("../../contracts/ANCON.sol/ANCON.json");
declare let window: any;

export default class AnconProtocol {
  prov: ethers.providers.Web3Provider;
  network: ethers.providers.Network | any;
  signer: ethers.providers.JsonRpcSigner;
  postProofCid: string;
  address: string;
  provider: any;
  anconAddress: string;
  daiAddress: string;
  xdvnftAdress: string;
  provWeb3: Web3;
  moniker: string;

  /**
   * needs to be initiliaze with a provider and an address
   */
  constructor(provider: any, address: string) {
    this.provider = provider;
    this.prov = new ethers.providers.Web3Provider(provider);
    this.provWeb3 = new Web3(provider);
    this.address = address;
    this.signer = this.prov.getSigner();
    this.network = "";
    this.postProofCid = "";
    this.anconAddress = "";
    this.daiAddress = "";
    this.xdvnftAdress = "";
    this.moniker = this.provWeb3.utils.keccak256("anconprotocol");
  }

  async initialize() {
    await this.getNetwork();
  }
  /**
   * @returns returns the network the user is in
   */
  async getNetwork() {
    const network = await this.prov.getNetwork();
    this.network = network;
    await this.getContractAddresses(network);
  }

  async getContractAddresses(network: any) {
    let anconAddress: any;
    let daiAddress: any;
    let xdvnftAdress: any;
    switch (this.network.chainId) {
      // bnbt
      case 97:
        anconAddress = process.env.NEXT_PUBLIC_ANCON_bnbt;
        daiAddress = process.env.NEXT_PUBLIC_DAI_bnbt;
        xdvnftAdress = process.env.NEXT_PUBLIC_XDVNFT_bnbt;
        break;
      // kovan
      case 42:
        anconAddress = process.env.NEXT_PUBLIC_ANCON_kovan;
        daiAddress = process.env.NEXT_PUBLIC_DAI_kovan;
        xdvnftAdress = process.env.NEXT_PUBLIC_XDVNFT_kovan;
        break;
      // mumbai
      case 80001:
        anconAddress = process.env.NEXT_PUBLIC_ANCON_mumbai;
        daiAddress = process.env.NEXT_PUBLIC_DAI_mumbai;
        xdvnftAdress = process.env.NEXT_PUBLIC_XDVNFT_mumbai;
        break;
    }
    this.anconAddress = anconAddress;
    this.daiAddress = daiAddress;
    this.xdvnftAdress = xdvnftAdress;
    return {
      ancon: this.anconAddress,
      dai: this.daiAddress,
      xdv: this.xdvnftAdress,
    };
  }
  /**
   *
   * @param address address to get the did from
   * @returns encoded did
   */
  async getDidTransaction() {
    const rawDid = await fetch(
      `https://api.ancon.did.pa/v0/did/raw:did:ethr:${this.network.name}:${this.address}`
    );

    const encodedDid = await rawDid.json();
    const content: any = await Object?.values(
      encodedDid.contentHash
    )[0];
    encodedDid.contentHash = content;
    return encodedDid;
  }

  async signMessage() {
    const rawDid = await fetch(
      `https://api.ancon.did.pa/v0/did/raw:did:ethr:${this.network.name}:${this.address}`
    );
    const encodedDid = await rawDid.json();
    return encodedDid;
  }

  /**
   *
   * @param proof the fetch object proof
   * @returns retunrn the to abi Proof
   */
  toAbiProof(proof: any) {
    proof.key = ethers.utils.hexlify(
      ethers.utils.base64.decode(proof.key)
    );

    proof.value = ethers.utils.hexlify(
      ethers.utils.base64.decode(proof.value)
    );

    proof.leaf.prefix = ethers.utils.hexlify(
      ethers.utils.base64.decode(proof.leaf.prefix)
    );
    proof.leaf.hash = 1;
    proof.path = proof.path.map((x: any) => {
      let suffix;
      if (!!x.suffix) {
        suffix = ethers.utils.hexlify(
          ethers.utils.base64.decode(x.suffix)
        );
        return {
          valid: true,
          prefix: ethers.utils.hexlify(
            ethers.utils.base64.decode(x.prefix)
          ),
          suffix: suffix,
          hash: 1,
        };
      } else {
        return {
          valid: true,
          prefix: ethers.utils.hexlify(
            ethers.utils.base64.decode(x.prefix)
          ),
          hash: 1,
          suffix: "0x",
        };
      }
    });
    proof.leaf.prehash_key = 0;
    proof.leaf.len = proof.leaf.length;
    proof.valid = true;
    proof.leaf.valid = true;

    return proof;
  }

  /**
   *
   * @param transactionHash transaction hash of a normal transfer made by the user
   * @returns an array containing [recoveredAddress, sentAddress, pubkey]
   */
  async getPubKey(transactionHash: string) {
    // gets the transaction
    const transaction: any = await this.prov.getTransaction(
      transactionHash
    );
    // joins the sig
    const sig = ethers.utils.joinSignature({
      r: transaction.r,
      s: transaction.s,
      v: transaction.v,
    });

    const txData = {
      gasPrice: transaction.gasPrice,
      gasLimit: transaction.gasLimit,
      value: transaction.value,
      nonce: transaction.nonce,
      data: transaction.data,
      chainId: transaction.chainId,
      to: transaction.to,
    };

    const rsTx = await ethers.utils.resolveProperties(txData);
    // returns RLP encoded tx
    const raw = ethers.utils.serializeTransaction(rsTx);
    // not sure about this step but it made it work
    const msgHash = ethers.utils.keccak256(raw);
    // create binary hash
    const msgBytes = ethers.utils.arrayify(msgHash);

    const pubkey = ethers.utils.recoverPublicKey(msgBytes, sig);

    const recoveredAddress = ethers.utils.recoverAddress(
      msgBytes,
      sig
    );

    return [recoveredAddress, transaction.from, pubkey];
  }

  /**
   *
   * @param proofEndpoint the endpoint to be called, ex:did/web
   * @param requestOptions the request options to be called
   * @param enrolling optional argument to receive also the user key and height
   * @returns an object {cid, ipfs} if enrolling returns {did, key, height}
   */
  async postProof(
    proofEndpoint: string,
    requestOptions: any,
    enrolling?: boolean
  ) {
    //   url to be called
    const url = `https://api.ancon.did.pa/v0/${proofEndpoint}`;

    // fetch
    const rawResponse = await fetch(url, requestOptions);
    //   jsoned response
    const response = await rawResponse.json();

    this.postProofCid = response.cid;

    const cid: string = response.cid;
    const ipfs: string = response.ipfs;
    
    let result;
    switch (enrolling) {
      case true:
        const did = await this.getDidTransaction();
        
        result = {
          contentCid: did.contentHash as string,
          proofKey: did.key as string,
          proofHeight: did.height as string,
          proofCid: cid,
          ipfs,
        };
        break;
      default:
        const dag = await this.fetchDag(cid);
        
        result = {
          proofCid: cid,
          ipfs,
          contentCid: dag.cid,
          proofKey: dag.proofKey,
          proofHeight: dag.proofHeight,
        };
        break;
    }
    return result;
  }

  /**
   *
   * @param key proof key
   * @param height proof height
   * @returns the to abi proof
   */
  async getProof(key: string, height: string) {
    const rawResult = await fetch(
      `https://api.ancon.did.pa/v0/proof/${key}?height=${height}`
    );
    const result = await rawResult.json();
   
    const abiedProof = await this.toAbiProof({
      ...result[0].Proof.exist,
    });
    return abiedProof;
  }

  async fetchDag(id: string) {
    const rawResponse = await fetch(
      `https://api.ancon.did.pa/v0/dagjson/${id}/`
    );
    const response = await rawResponse.json();
    
    const cid = await Object?.values(response.contentHash)[0];
    return {
      cid: cid as string,
      proofKey: response.key as string,
      proofHeight: response.height as string,
    };
  }

  /**
   *
   * @param cid did return from get proof
   * @param proof the to abi proof
   * @returns the result of the enrollment
   */
  async EnrollL2Account(cid: string, proof: any) {
    console.log("enrolling to L2");
    // try {
    const anconContractReader = AnconProtocol__factory.connect(
      this.anconAddress,
      this.prov
    );
    const contract2 = AnconProtocol__factory.connect(
      this.anconAddress,
      this.signer
    );

    // encoded to utf8
    const UTF8_cid = ethers.utils.toUtf8Bytes(cid);

    // get proof
    const getProof = await anconContractReader.getProof(UTF8_cid);
    
    if (getProof !== "0x") {
      return "proof already exist";
    }

    // check the hashes
    const rawLastHash = await fetch(
      "https://api.ancon.did.pa/v0/proofs/lasthash"
    );
    const lasthash = await rawLastHash.json();


    // make a Web3 prov to call the dai contract

    const dai = new this.provWeb3.eth.Contract(
      AnconToken.abi,
      this.daiAddress
    );

    // get the height
    const did = await this.getDidTransaction();
    const height = did.height;

    const hash = ethers.utils.hexlify(
      ethers.utils.base64.decode(lasthash.lastHash.hash)
    );
    await this.getPastEvents();

  
    // check the allowance
    const allowance = await dai.methods
      .allowance(this.address, this.anconAddress)
      .call();
  
    // enroll based on the network
    let enroll;
    switch (this.network.chainId) {
      case 97:
        if (allowance == 0) {
          // await dai.methods
          //   .approve(contract2.address, "1000000000000000000000")
          //   .send({
          //     gasPrice: "22000000000",
          //     gas: 400000,
          //     from: this.address,
          //   });
        }
        enroll = await contract2.enrollL2Account(
          this.moniker,
          proof.key,
          UTF8_cid,
          proof,
          {
            gasPrice: "22000000000",
            gasLimit: 400000,
          }
        );

        break;
      case 42:
        // if (allowance == 0) {
        // await dai.methods
        //   .approve(contract2.address, "1000000000000000000000")
        //   .send({
        //     gasPrice: "400000000000",
        //     gas: 700000,
        //     from: this.address,
        //   });
        // }
        enroll = await contract2.enrollL2Account(
          this.moniker,
          proof.key,
          UTF8_cid,
          proof,
          {
            gasPrice: "400000000000",
            gasLimit: 900000,
            from: this.address,
          }
        );
        
        break;
      case 80001:
        // if (allowance == 0) {
        // await dai.methods
        //   .approve(contract2.address, "1000000000000000000000")
        //   .send({
        //     gasPrice: "22000000000",
        //     gas: 400000,
        //     from: this.address,
        //   });
        // }
        enroll = await contract2.enrollL2Account(
          this.moniker,
          proof.key,
          UTF8_cid,
          proof,
          {
            gasPrice: "22000000000",
            gasLimit: 400000,
          }
        );

        break;
    }
    await enroll?.wait(1);
    console.log("enrolled");
    console.log(enroll);
    return enroll;
    // } catch (error) {
    //   console.log("error", error);
    // }
  }

  /**
   *
   * @returns returns true when the protocol is updated
   */
  async getPastEvents() {
   
    // instiate the contract
    const AnconReader = await AnconProtocol__factory.connect(
      this.anconAddress,
      this.prov
    );

    // filter the contract
    const filter = await AnconReader.filters.HeaderUpdated(
      this.moniker
    );

    // get the from
    const from = await this.prov.getBlockNumber();

    // query the filter
    let result = await AnconReader.queryFilter(filter, from);

    // checking hashes
    const rawLastHash = await fetch(
      "https://api.ancon.did.pa/v0/proofs/lasthash"
    );
    const lasthash = await rawLastHash.json();
    const decodedlastHash = ethers.utils.hexlify(
      ethers.utils.base64.decode(lasthash.lastHash.hash)
    );
  
    let sequence = lasthash.lastHash.version;
   
    let time = Date.now();
    const maxTime = Date.now() + 120000;
    let relayHash = "0x";
    while (time < maxTime) {
      try {
        sequence += 1;
        result = await AnconReader.queryFilter(filter, from);
        if (result.length > 0) {
          break;
        }
        time = Date.now();
        await sleep(1000);
      } catch (error) {
        console.log("error", error);
      }
    }
    return true;
  }

  async mintNft(hexData: string, userProofKey: string) {
   

    const xdvReader = XDVNFT__factory.connect(
      this.xdvnftAdress,
      this.prov
    );
    const xdvSigner = XDVNFT__factory.connect(
      this.xdvnftAdress,
      this.signer
    );
    const anconReader = AnconProtocol__factory.connect(
      this.anconAddress,
      this.prov
    );

    const dai = new this.provWeb3.eth.Contract(
      AnconToken.abi,
      this.daiAddress
    );

    // check the allowance
    const allowance = await dai.methods
      .allowance(this.address, xdvSigner.address)
      .call();
    await sleep(7000);

    const did = await this.getDidTransaction();

    // get the last hash
    const rawLastHash = await fetch(
      "https://api.ancon.did.pa/v0/proofs/lasthash"
    );
    const lasthash = await rawLastHash.json();
    const version = lasthash.lastHash.version;
    /* prepare the packet and user proof
     */
    // prepare packet proof
    const packetProof = await this.getProof(userProofKey, version);
    
    // prepare user proof
    const userProof = await this.getProof(did.key, version);
   
    // start minting
    let mint;
    switch (this.network.chainId) {
      case 97:
      case 80001:
        try {
          mint = await xdvSigner.mintWithProof(
            hexData,
            userProof,
            packetProof
          );
        } catch (error) {
          sleep(5000);
          console.log("failed, trying again...", error);
          mint = await xdvSigner.mintWithProof(
            hexData,
            userProof,
            packetProof
          );
        }
        break;
      case 42:
        // tries two times in case it fails
        try {
          mint = await xdvSigner.mintWithProof(
            hexData,
            userProof,
            packetProof,
            {
              gasPrice: "200000000000",
              gasLimit: 900000,
              from: this.address,
            }
          );
          console.log(mint);
        } catch (error) {
          console.log("failed, trying again...", error);
          sleep(5000);
          mint = await xdvSigner.mintWithProof(
            hexData,
            userProof,
            packetProof,
            {
              gasPrice: "200000000000",
              gasLimit: 900000,
              from: this.address,
            }
          );
        }
        break;
    }
    return mint;
  }

  async getDomainName() {
    const rawResponse = await fetch(
      `https://api.ancon.did.pa/v0/did/did:ethr:${this.network.name}:${this.address}`
    );
    const response = await rawResponse.json();
    if (rawResponse.status === 400) {
      return false;
    }
    return true;
  }

  async getMetadata(cid: string, address: string) {
    const rawData = await fetch(
      `https://api.ancon.did.pa/v0/dag/${cid}/?namespace=anconprotocol/users/${address}`
    );
    const data = await rawData.json();
    
    data["root"] = await await Object?.values(data.root)[0];
    return data;
  }
}

export function sleep(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

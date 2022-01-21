import { ethers } from "ethers";
import Web3 from "web3";

/**
 * needs to be initiliaze with a provider and an address
 */
class AnconProtocol {
  prov: ethers.providers.Web3Provider;
  network: ethers.providers.Network;
  signer: ethers.providers.JsonRpcSigner;
  postProofCid: string;
  address: string;
  provider: any;
  anconAddress: string;
  daiAddress: string;
  xdvnftAdress: string;
  provWeb3: Web3;

  constructor(provider, address) {
    this.provider = provider;
    this.prov = new ethers.providers.Web3Provider(provider);
    this.provWeb3 = new Web3(provider);
    this.address = address;
    this.signer = this.prov.getSigner();
    this.getNetwork();
    this.getContractAddresses();
  }

  /**
   * @returns returns the network the user is in
   */
  async getNetwork() {
    this.network = await this.prov.getNetwork();
    return this.network;
  }

  async getContractAddresses() {
    switch (this.network.chainId) {
      case 97:
        this.anconAddress = env.NEXT_PUBLIC_ANCON_bnbt;
        this.daiAddress = env.NEXT_PUBLIC_DAI_bnbt;
        this.xdvnftAdress = env.NEXT_PUBLIC_XDVNFT_bnbt;
        break;
      case 42:
        this.anconAddress = env.NEXT_PUBLIC_ANCON_kovan;
        this.daiAddress = env.NEXT_PUBLIC_DAI_kovan;
        this.xdvnftAdress = env.NEXT_PUBLIC_XDVNFT_kovan;
        break;
    }
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
  async getDid() {
    const rawDid = await fetch(
      `https://api.ancon.did.pa/v0/did/raw:${this.address}`
    );
    const encodedDid = await rawDid.json();
    return encodedDid;
  }

  /**
   *
   * @param proof the fetch object proof
   * @returns retunrn the to abi Proof
   */
  toAbiProof(proof) {
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
   * @returns an array containing [recoveredAddress, pubkey]
   */
  async getPubKey(transactionHash: string) {
    // gets the transaction
    const transaction = await this.prov.getTransaction(
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

    return [recoveredAddress, pubkey];
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
    requestOptions,
    enrolling?: boolean
  ) {
    //   url to be called
    const url = `https://api.ancon.did.pa/v0/${proofEndpoint}`;

    // fetch
    const rawResult = await fetch(
      "https://api.ancon.did.pa/v0/did/web",
      requestOptions
    );
    //   jsoned response
    const result = await rawResult.json();

    this.postProofCid = result.cid;
    const cid = result.cid;
    const ipfs = result.ipfs;
    if (enrolling) {
      const did = await this.getDid();
      const content = await Object?.values(did.content)[0];
      return {
        did: content,
        userProofKey: did.key,
        userProofHeight: did.height,
      };
    }
    return { cid, ipfs };
  }

  /**
   *
   * @param key proof key
   * @param height proof height
   * @returns the to abi proof
   */
  async getProof(key, height) {
    const rawResult = await fetch(
      `https://api.ancon.did.pa/v0/proof/${key}?height=${height}`
    );
    const result = await rawResult.json();
    const abiedProof = await this.toAbiProof({
      ...result[0].Proof.exist,
    });
    return abiedProof;
  }

  /**
   * 
   * @param cid did return from get proof
   * @param proof the to abi proof
   * @returns the result of the enrollment
   */
  async EnrollL2Account(cid: string, proof: any) {
    console.log("enrolling to L2");
    try {
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
      const relayHash = await anconContractReader.getProtocolHeader();
      const version = lasthash.lastHash.version;

      // make a Web3 prov to call the dai contract

      this.provWeb3.eth.defaultAccount = this.address;
      const dai = new this.provWeb3.eth.Contract(
        AnconToken.abi,
        this.daiAddress
      );

      const did = await this.getDid();
      const height = did.height;
      const hash = ethers.utils.hexlify(
        ethers.utils.base64.decode(lasthash.lastHash.hash)
      );

      // wait for the header to be updated
      const filter = anconContractReader.filters.HeaderUpdated();
      const from = await this.prov.getBlockNumber();
      let result = await anconContractReader.queryFilter(
        filter,
        from
      );


      let time = Date.now();
      const maxTime = Date.now() + 180000;
      if (hash !== relayHash) {
        console.log("hashes differ", height, version);
        while (time < maxTime) {
          result = await anconContractReader.queryFilter(
            filter,
            from
          );
          console.log(result);
          if (result.length > 0) {
            break;
          }
          time = Date.now();
          await sleep(10000);
        }
      }

      // check the allowance
      const allowance = await dai.methods
        .allowance(this.address, contract2.address)
        .call();

      // enroll based on the network
      let enroll;
      switch (this.network.chainId) {
        case 97:
          if (allowance == 0) {
            await dai.methods
              .approve(contract2.address, "1000000000000000000000")
              .send({
                gasPrice: "22000000000",
                gas: 400000,
                from: this.address,
              });
          }
          enroll = await contract2.enrollL2Account(
            proof.key,
            UTF8_cid,
            proof,
            {
              gasPrice: "22000000000",
              gasLimit: 400000,
            }
          );
          return enroll;
          break;
        case 42:
          // if (allowance == 0) {
          await dai.methods
            .approve(contract2.address, "1000000000000000000000")
            .send({
              gasPrice: "400000000000",
              gas: 700000,
              from: this.address,
            });
          // }
          enroll = await contract2.enrollL2Account(
            proof.key,
            UTF8_cid,
            proof,
            {
              gasPrice: "400000000000",
              gasLimit: 900000,
              from: this.address,
            }
          );
          console.log("enrolled", enroll);
          return enroll;
          break;
      }
      console.log("enrolled");
    } catch (error) {
      console.log("error", error);
    }
  }
}

export function sleep(ms: any) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
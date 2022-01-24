/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { Faucet, FaucetInterface } from "../Faucet";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_token1",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "paymentAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdrawn",
    type: "event",
  },
  {
    inputs: [],
    name: "token1",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "token2",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "payee",
        type: "address",
      },
    ],
    name: "getTokenFromFaucet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x608060405234801561001057600080fd5b5060405161058838038061058883398101604081905261002f91610054565b600080546001600160a01b0319166001600160a01b0392909216919091179055610084565b60006020828403121561006657600080fd5b81516001600160a01b038116811461007d57600080fd5b9392505050565b6104f5806100936000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c806325be124e14610046578063ba27843114610075578063d21220a71461008a575b600080fd5b600154610059906001600160a01b031681565b6040516001600160a01b03909116815260200160405180910390f35b610088610083366004610454565b61009d565b005b600054610059906001600160a01b031681565b6001600160a01b03811660009081526002602052604090205462015180106101325760405162461bcd60e51b815260206004820152602d60248201527f4d757374207761697420312064617920746f2077697468647261772066726f6d60448201527f207468697320616464726573730000000000000000000000000000000000000060648201526084015b60405180910390fd5b6000546040517fdd62ed3e0000000000000000000000000000000000000000000000000000000081526001600160a01b03838116600483015230602483015290911690671bc16d674ec8000090829063dd62ed3e90604401602060405180830381865afa1580156101a7573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906101cb9190610484565b10156102195760405162461bcd60e51b815260206004820152601760248201527f496e76616c696420746f6b656e20616c6c6f77616e63650000000000000000006044820152606401610129565b6040517f70a082310000000000000000000000000000000000000000000000000000000081523060048201526000906001600160a01b038316906370a0823190602401602060405180830381865afa158015610279573d6000803e3d6000fd5b505050506040513d601f19601f8201168201806040525081019061029d9190610484565b9050670de0b6b3a7640000811161031b5760405162461bcd60e51b8152602060048201526024808201527f42616c616e6365206d75737420626520686967686572207468616e203120657460448201527f68657220000000000000000000000000000000000000000000000000000000006064820152608401610129565b6040517fa9059cbb0000000000000000000000000000000000000000000000000000000081526001600160a01b038481166004830152670de0b6b3a7640000602483015283169063a9059cbb906044016020604051808303816000875af115801561038a573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906103ae919061049d565b6103fa5760405162461bcd60e51b815260206004820152601d60248201527f416e636f6e204661756365743a205472616e73666572206661696c65640000006044820152606401610129565b6001600160a01b03831660008181526002602052604090819020429055517f7084f5476618d8e60b11ef0d7d3f06914655adb8793e28ff7f018d4c76d505d5906104479084815260200190565b60405180910390a2505050565b60006020828403121561046657600080fd5b81356001600160a01b038116811461047d57600080fd5b9392505050565b60006020828403121561049657600080fd5b5051919050565b6000602082840312156104af57600080fd5b8151801515811461047d57600080fdfea26469706673582212204e51378aab11dc8abf096e81a33ef64839d3baa77a69990f1d12d9db1d2d9e2164736f6c634300080a0033";

type FaucetConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: FaucetConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class Faucet__factory extends ContractFactory {
  constructor(...args: FaucetConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    _token1: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<Faucet> {
    return super.deploy(_token1, overrides || {}) as Promise<Faucet>;
  }
  getDeployTransaction(
    _token1: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_token1, overrides || {});
  }
  attach(address: string): Faucet {
    return super.attach(address) as Faucet;
  }
  connect(signer: Signer): Faucet__factory {
    return super.connect(signer) as Faucet__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): FaucetInterface {
    return new utils.Interface(_abi) as FaucetInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): Faucet {
    return new Contract(address, _abi, signerOrProvider) as Faucet;
  }
}
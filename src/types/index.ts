// creates the escrow parameters for create escroe
// userseed is the seed of the user who is creating the escrow
// potaddress is the address of the pot wallet
// amountxrp is the amount of xrp to escrow
// deadline is the deadline of the escrow
export interface CreateEscrowParams {
  userSeed: string;
  potAddress: string;
  amountXRP: string;
  deadline: Date;
}

// creates the escrow result for create escroe
// escrowsequence is the sequence of the escrow
// txhash is the hash of the escrow transaction (hash which ids the transaction)
export interface CreateEscrowResult {
  escrowSequence: number;
  txHash: string;
}

// finish escrow params ( what we pass into finshEscrow function)
// potwalletseed - self explanatory
// useraddress - the address of the escrow owner
// escrowsequence - the sequence of the escrow
export interface FinishEscrowParams {
  potWalletSeed: string;
  userAddress: string;
  escrowSequence: number;
}

// cancel escrow params ( what we pass into cancelEscrow function)
// userseed - the seed of the user who is canceling the escrow
// useraddress - the address of the escrow owner
// escrowsequence - the sequence of the escrow
export interface CancelEscrowParams {
  userSeed: string;
  userAddress: string;
  escrowSequence: number;
}

// escrow tx result ( what we get back from the escrow transaction)
// txhash is the hash of the escrow transaction (hash which ids the transaction)
export interface EscrowTxResult {
  txHash: string;
}

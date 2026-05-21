import crypto from 'crypto';

export interface Transaction {
  recordId: string;
  cid: string;
  documentHash: string;
  ownerId: string;
  patientName: string;
  timestamp: number;
}

export class Block {
  public hash: string;

  constructor(
    public index: number,
    public timestamp: number,
    public transactions: Transaction[],
    public previousHash: string,
    public nonce: number = 0
  ) {
    this.hash = this.calculateHash();
  }

  calculateHash(): string {
    return crypto
      .createHash('sha256')
      .update(this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce)
      .digest('hex');
  }

  mineBlock(difficulty: number) {
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

export class Blockchain {
  public chain: Block[];
  public difficulty: number;

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 3; // Difficulty level for proof-of-work
    console.log("Local In-Memory Blockchain initialized.");
  }

  createGenesisBlock(): Block {
    return new Block(0, Date.now(), [], '0');
  }

  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction: Transaction): string {
    console.log(`Mining new block for record ${transaction.recordId}...`);
    const newBlock = new Block(
      this.chain.length,
      Date.now(),
      [transaction],
      this.getLatestBlock().hash
    );
    
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    console.log(`Block mined! Hash: ${newBlock.hash}`);
    
    return newBlock.hash; // Return block hash as the txHash
  }

  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }
}


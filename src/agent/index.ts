import { config } from "dotenv";
import { ethers } from "ethers";
import { KrakenCLIClient } from "../exchange/kraken";
import { RiskRouter } from "../onchain/riskRouter";
import { ValidationRegistryClient } from "../onchain/validationRegistry";
import { CheckpointManager } from "../explainability/checkpoint";

config();

export class Agent {
  private agentId: number;
  private pair: string;
  private intervalSeconds: number;
  private running: boolean = true;
  private priceHistory: number[] = [];
  private kraken: KrakenCLIClient;
  private riskRouter: RiskRouter;
  private validationRegistry: ValidationRegistryClient;
  private checkpointManager: CheckpointManager;
  private signer: ethers.Wallet;

  constructor(options: {
    agentId: number;
    pair?: string;
    intervalSeconds?: number;
  }) {
    this.agentId = options.agentId;
    this.pair = options.pair || "XBTUSD";
    this.intervalSeconds = options.intervalSeconds || 30;
    
    // Initialize Kraken CLI client
    this.kraken = new KrakenCLIClient();
    
    // Setup on-chain connections
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    this.riskRouter = new RiskRouter(this.signer);
    this.validationRegistry = new ValidationRegistryClient(this.signer);
    this.checkpointManager = new CheckpointManager(this.signer, this.agentId);
  }

  async run() {
    console.log(`🚀 AI Trading Agent Started`);
    console.log(`Agent ID: ${this.agentId}`);
    console.log(`Pair: ${this.pair}`);
    console.log(`Strategy: Aggressive (3 samples, 0.3% threshold, $100 trades)`);
    console.log(`Interval: ${this.intervalSeconds}s`);
    console.log(``);
    
    while (this.running) {
      try {
        // Get current price from Kraken CLI
        const ticker = await this.kraken.getTicker(this.pair);
        const price = ticker.price;
        
        // Add to price history
        this.priceHistory.push(price);
        if (this.priceHistory.length > 3) {
          this.priceHistory.shift();
        }
        
        // Make trading decision
        let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
        let amount = 0;
        let confidence = 0.5;
        let reasoning = '';
        
        if (this.priceHistory.length < 3) {
          reasoning = `Warming up: have ${this.priceHistory.length}/3 price samples. Holding.`;
        } else {
          const first = this.priceHistory[0];
          const last = this.priceHistory[2];
          const changePct = ((last - first) / first) * 100;
          
          if (changePct > 0.3) {
            action = 'BUY';
            amount = 100;
            confidence = Math.min(0.9, 0.55 + changePct / 8);
            reasoning = `Upward momentum: price rose ${changePct.toFixed(2)}% over last 3 samples. Buying $100.`;
          } else if (changePct < -0.3) {
            action = 'SELL';
            amount = 100;
            confidence = Math.min(0.9, 0.55 + Math.abs(changePct) / 8);
            reasoning = `Downward momentum: price fell ${Math.abs(changePct).toFixed(2)}% over last 3 samples. Selling.`;
          } else {
            reasoning = `No clear momentum (${changePct.toFixed(2)}% change). Holding.`;
          }
        }
        
        // Log the decision
        console.log(`[${new Date().toISOString()}] XBTUSD @ $${price.toFixed(2)}`);
        console.log(`Action: ${action}`);
        console.log(`Confidence: ${Math.round(confidence * 100)}%`);
        console.log(`Reason: ${reasoning}`);
        
        // If it's a trade, execute via Risk Router
        if (action !== 'HOLD') {
          console.log(`🚀 EXECUTING ${action} ORDER: $${amount}`);
          
          try {
            // Get current nonce
            const nonce = await this.riskRouter.getIntentNonce(this.agentId);
            
            // Create trade intent
            const deadline = Math.floor(Date.now() / 1000) + 300;
            
            // Submit trade via Risk Router
            const tx = await this.riskRouter.submitTradeIntent({
              agentId: this.agentId,
              agentWallet: await this.signer.getAddress(),
              pair: this.pair,
              action: action,
              amountUsdScaled: amount * 100,
              maxSlippageBps: 100,
              nonce: nonce,
              deadline: deadline
            });
            
            console.log(`✅ Trade submitted: ${tx.hash}`);
            
            // Wait for confirmation
            await tx.wait();
            console.log(`🎉 Trade confirmed on-chain!`);
            
            // Post checkpoint to ValidationRegistry
            const checkpointHash = ethers.id(JSON.stringify({
              agentId: this.agentId,
              timestamp: Date.now(),
              action,
              amount,
              price
            }));
            
            await this.validationRegistry.postEIP712Attestation(
              this.agentId,
              checkpointHash,
              85,
              reasoning
            );
            console.log(`📝 Checkpoint posted to ValidationRegistry`);
            
          } catch (error) {
            console.error(`❌ Trade failed:`, error.message);
          }
        }
        
        console.log(``);
        
        // Wait for next interval
        await new Promise(resolve => setTimeout(resolve, this.intervalSeconds * 1000));
      } catch (error) {
        console.error(`Error:`, error.message);
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }
  
  stop() {
    this.running = false;
  }
}

// Run the agent
const agentId = parseInt(process.env.AGENT_ID || "0");
const agent = new Agent({ agentId });
agent.run().catch(console.error);

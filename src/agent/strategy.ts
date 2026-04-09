import { MarketData, TradeDecision, TradingStrategy } from "../types/index";

// ─────────────────────────────────────────────────────────────────────────────
// Aggressive momentum strategy - trades on smaller price movements
// ─────────────────────────────────────────────────────────────────────────────

export class MomentumStrategy implements TradingStrategy {
  private priceHistory: number[] = [];
  private readonly windowSize: number;
  private readonly tradeAmountUsd: number;

  constructor(windowSize = 3, tradeAmountUsd = 100) {  // Changed: window 5→3, amount 100 (same)
    this.windowSize = windowSize;
    this.tradeAmountUsd = tradeAmountUsd;
  }

  async analyze(data: MarketData): Promise<TradeDecision> {
    this.priceHistory.push(data.price);
    if (this.priceHistory.length > this.windowSize) {
      this.priceHistory.shift();
    }

    if (this.priceHistory.length < this.windowSize) {
      return {
        action: "HOLD",
        asset: data.pair.replace("USD", ""),
        pair: data.pair,
        amount: 0,
        confidence: 0.5,
        reasoning: `Warming up: have ${this.priceHistory.length}/${this.windowSize} price samples. Holding.`,
      };
    }

    const first = this.priceHistory[0];
    const last = this.priceHistory[this.priceHistory.length - 1];
    const changePct = ((last - first) / first) * 100;
    const spread = ((data.ask - data.bid) / data.price) * 100;

    let action: TradeDecision["action"] = "HOLD";
    let confidence = 0.5;
    let reasoning = "";

    // LOWERED THRESHOLD: 0.3% instead of 0.5%
    if (changePct > 0.3 && spread < 0.1) {
      action = "BUY";
      confidence = Math.min(0.9, 0.55 + Math.abs(changePct) / 8);  // Higher base confidence
      reasoning = `Upward momentum: price rose ${changePct.toFixed(2)}% over last ${this.windowSize} ticks. Spread is tight at ${spread.toFixed(3)}%. Buying.`;
    } 
    // LOWERED THRESHOLD: 0.3% instead of 0.5%
    else if (changePct < -0.3) {
      action = "SELL";
      confidence = Math.min(0.9, 0.55 + Math.abs(changePct) / 8);
      reasoning = `Downward momentum: price fell ${Math.abs(changePct).toFixed(2)}% over last ${this.windowSize} ticks. Selling to avoid further loss.`;
    } 
    else {
      reasoning = `No clear momentum (${changePct.toFixed(2)}% change). Holding current position.`;
    }

    return {
      action,
      asset: data.pair.replace("USD", ""),
      pair: data.pair,
      amount: action === "HOLD" ? 0 : this.tradeAmountUsd,  // $100 position size
      confidence,
      reasoning,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LLM-backed strategy stub — replace the body of analyze() with your model call
// ─────────────────────────────────────────────────────────────────────────────

export class LLMStrategy implements TradingStrategy {
  async analyze(data: MarketData): Promise<TradeDecision> {
    // Stub: always HOLD until you wire in your model
    return {
      action: "HOLD",
      asset: data.pair.replace("USD", ""),
      pair: data.pair,
      amount: 0,
      confidence: 0.5,
      reasoning: "LLMStrategy stub — wire in your model in src/agent/strategy.ts",
    };
  }
}

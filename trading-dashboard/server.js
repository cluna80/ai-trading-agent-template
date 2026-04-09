const { spawn } = require('child_process');
const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const PORT = 3000;
const clients = new Set();
let priceHistory = [];
const TRADE_HISTORY_FILE = '/mnt/c/Users/krizz/OneDrive/Desktop/ai-trading-agent-template/trade_history.json';
function getTradeHistory() {
  try { if (fs.existsSync(TRADE_HISTORY_FILE)) return JSON.parse(fs.readFileSync(TRADE_HISTORY_FILE, 'utf8')); } catch(e) {}
  return [];
}
function broadcast(type, msg) {
  const data = JSON.stringify({ type, msg, ts: new Date().toISOString() });
  for (const client of clients) { if (client.readyState === 1) client.send(data); }
}
const agent = spawn('node', ['continuous_trader_upgraded.js'], { env: process.env, cwd: '/mnt/c/Users/krizz/OneDrive/Desktop/ai-trading-agent-template' });
agent.stdout.on('data', (data) => {
  data.toString().split('\n').filter(Boolean).forEach(line => {
    process.stdout.write(line + '\n');
    let type = 'info';
    if (line.includes('\u2705')) type = 'trade';
    else if (line.includes('\u274c')) type = 'error';
    else if (line.includes('\uD83D\uDCCC')) type = 'hold';
    else if (line.includes('\uD83D\uDEA8')) type = 'exit';
    const priceMatch = line.match(/\$(\d+\.?\d*)/);
    const rsiMatch = line.match(/RSI:([\d.]+)/);
    const momMatch = line.match(/Mom:([-\d.]+)%/);
    const sharpeMatch = line.match(/Sharpe:([-\d.]+)/);
    const posMatch = line.match(/(?:Pos:|[|]\s*)(LONG|SHORT|FLAT)/);
    if (priceMatch && rsiMatch) {
      const price = parseFloat(priceMatch[1]);
      priceHistory.push({ time: Date.now(), price });
      if (priceHistory.length > 50) priceHistory.shift();
      broadcast('tick', { price: priceMatch[1], rsi: rsiMatch[1], momentum: momMatch ? momMatch[1] : '0', sharpe: sharpeMatch ? sharpeMatch[1] : '0', position: posMatch ? posMatch[1] : 'FLAT', priceHistory: priceHistory.slice(-20) });
    }
    const holdMatch = line.match(/Holding (\w+) @ \$([\d.]+) \| Unrealized: ([-+\d.]+)%/);
    if (holdMatch) broadcast('hold', { position: holdMatch[1], entry: holdMatch[2], unrealized: holdMatch[3] });
    broadcast('log', { msg: line, type });
    if (line.includes('TAKE PROFIT') || line.includes('STOP LOSS')) {
      setTimeout(() => broadcast('history', getTradeHistory()), 2000);
    }
  });
});
agent.stderr.on('data', (d) => { process.stderr.write(d.toString()); broadcast('log', { msg: d.toString().trim(), type: 'error' }); });
agent.on('exit', (c) => broadcast('log', { msg: 'Agent exited: ' + c, type: 'error' }));
async function fetchPRISM() {
  try {
    const r = await fetch('https://api.prismapi.ai/resolve/BTC', { headers: { 'X-API-Key': 'prism_sk_3NXvJNrlk-TsDRmLIHfTro1381O7Wg6gv809K_G1lvc' } });
    const d = await r.json();
    broadcast('prism', { confidence: d.confidence, venues: d.venues && d.venues.data ? d.venues.data.slice(0,5) : [] });
  } catch(e) { console.log('PRISM timeout'); }
}
setInterval(fetchPRISM, 60000); fetchPRISM();
setInterval(() => broadcast('history', getTradeHistory()), 30000);

const htmlContent = fs.readFileSync('/mnt/c/Users/krizz/OneDrive/Desktop/trading-dashboard/dashboard.html', 'utf8');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(htmlContent);
});
const wss = new WebSocketServer({ server });
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'log', msg: { msg: 'Connected to Agent #31', type: 'info' } }));
  ws.send(JSON.stringify({ type: 'history', msg: getTradeHistory() }));
  ws.on('close', () => clients.delete(ws));
});
server.listen(PORT, () => {
  console.log('');
  console.log('=======================================================');
  console.log('AI TRADING DASHBOARD');
  console.log('=======================================================');
  console.log('Open: http://localhost:' + PORT);
  console.log('REAL TRADING ACTIVE');
  console.log('=======================================================');
  console.log('');
});
process.on('SIGINT', () => { agent.kill(); process.exit(); });

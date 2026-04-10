#!/usr/bin/env node

const Table = require("cli-table3");
const WebSocket = require("ws");

console.clear();

class ActivityMonitor {
  constructor(displayRows = 15) {
    this.isRunning = false;
    this.lastUpdateTime = 0;
    this.noFlash = true;
    this.firstRender = true;
    this.displayRows = displayRows;

    this.ws = null;
    this.topTokens = [];
    this.analyzedTokens = [];
    this.updateCount = 0;
  }

  // ============================================================================
  // WEBSOCKET - NO BULLSHIT
  // ============================================================================

  connectWebSocket() {
    this.ws = new WebSocket("wss://data.cmem.ai/activity");

    this.ws.on("message", (data) => {
      this.handleMessage(data.toString());
    });

    this.ws.on("error", () => {
      // Ignore WebSocket errors silently
    });
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);

      // Handle token updates
      if ((message.type === "update" || message.type === "snapshot") && Array.isArray(message.data)) {
        this.topTokens = message.data;
        this.updateCount++;
        this.processTokens();
        this.refresh();
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  processTokens() {
    const tokens = this.topTokens || [];

    this.analyzedTokens = tokens.map((token) => ({ token }));
  }

  // ============================================================================
  // DISPLAY
  // ============================================================================

  refresh() {
    if (!this.isRunning) return;

    // Throttle updates
    const now = Date.now();
    if (now - this.lastUpdateTime < 500) return;
    this.lastUpdateTime = now;

    // Build output
    let output = "";

    // Clear screen
    if (this.noFlash) {
      output += "\x1b[H\x1b[J";
    } else {
      output += "\x1b[2J\x1b[H";
    }

    // Header
    output += this.buildHeader();

    // Table
    output += this.buildTable();

    // Footer
    output += this.buildFooter();

    // Write all at once
    process.stdout.write(output);
  }

  buildHeader() {
    const now = new Date();

    let output = `\x1b[1m🎯 LIVE ACTIVITY MONITOR\x1b[0m \x1b[90m${now.toLocaleTimeString()}\x1b[0m\n`;
    output += `\x1b[90mTokens: ${this.topTokens.length} • Updates: ${this.updateCount}\x1b[0m\n\n`;

    return output;
  }

  buildTable() {
    if (this.analyzedTokens.length === 0) {
      return "\x1b[31m❌ No active tokens\x1b[0m\n\n";
    }

    let output = "\x1b[1m🔥 HOT POTATO GAME: Buy Pressure Sorted\x1b[0m\n";
    output += "\x1b[90mBuyP = 5m net buying pressure | Pool = liquidity | U/m = updates per minute | Age = token age | Disc = time discovered\x1b[0m\n\n";

    const table = new Table({
      head: ["#", "Symbol", "1m%", "2m%", "3m%", "4m%", "5m%", "BuyP", "Pool", "U/m", "Age", "Disc", "Signal"],
      colWidths: [3, 8, 6, 6, 6, 6, 6, 7, 6, 5, 8, 8, 9],
      style: {
        head: ["cyan"],
        border: [],
        "padding-left": 0,
        "padding-right": 0,
      },
      chars: {
        top: "",
        "top-mid": "",
        "top-left": "",
        "top-right": "",
        bottom: "",
        "bottom-mid": "",
        "bottom-left": "",
        "bottom-right": "",
        left: "",
        "left-mid": "",
        mid: "",
        "mid-mid": "",
        right: "",
        "right-mid": "",
        middle: " ",
      },
    });

    // Display top N rows
    let displayCount = 0;
    for (const item of this.analyzedTokens.slice(0, this.displayRows)) {
      const { token } = item;

      const formatGain = (gain) => {
        const val = gain || 0;
        const color = val > 0 ? "\x1b[32m" : val < 0 ? "\x1b[31m" : "\x1b[90m";
        return `${color}${val > 0 ? "+" : ""}${val.toFixed(1)}%\x1b[0m`;
      };

      const formatBuyPressure = (pressure) => {
        const val = pressure || 0;
        const color = val > 5000 ? "\x1b[92m" : val > 1000 ? "\x1b[32m" : val > 0 ? "\x1b[33m" : "\x1b[31m";
        return `${color}${val >= 1000 ? "$" + (val / 1000).toFixed(1) + "K" : "$" + val.toFixed(0)}\x1b[0m`;
      };

      const formatLiquidity = (liq) => {
        const val = parseFloat(liq || 0);
        if (val >= 10000000) return "\x1b[92m" + (val / 1000000).toFixed(0) + "M\x1b[0m";
        if (val >= 1000000) return "\x1b[32m" + (val / 1000000).toFixed(1) + "M\x1b[0m";
        if (val >= 100000) return "\x1b[33m" + (val / 1000).toFixed(0) + "K\x1b[0m";
        return "\x1b[37m" + (val / 1000).toFixed(0) + "K\x1b[0m";
      };

      const formatTime = (timestamp, isTokenAge = false) => {
        if (!timestamp) return "\x1b[90m--\x1b[0m";
        const ageMs = Date.now() - timestamp;
        const totalSeconds = Math.floor(ageMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const hours = Math.floor(totalSeconds / 3600);
        const days = Math.floor(totalSeconds / 86400);

        if (days > 0) {
          return isTokenAge ? `\x1b[91m${days}d\x1b[0m` : `\x1b[35m${days}d\x1b[0m`;
        } else if (hours > 0) {
          return `\x1b[35m${hours}h\x1b[0m`;
        } else if (minutes > 0) {
          return `\x1b[95m${minutes}m\x1b[0m`;
        } else {
          return `\x1b[93m${totalSeconds}s\x1b[0m`;
        }
      };

      table.push([(++displayCount).toString(), (token.symbol || "UNK").substring(0, 7), formatGain(token.oneMinGain), formatGain(token.twoMinGain), formatGain(token.threeMinGain), formatGain(token.fourMinGain), formatGain(token.fiveMinGain), formatBuyPressure(token.buyPressure5m), formatLiquidity(token.liquidity), `\x1b[36m${Math.round(token.updatesPerMinute || 0)}\x1b[0m`, formatTime(token.createdAt ? new Date(token.createdAt).getTime() : null, true), formatTime(token.firstSeen), token.signal || "\x1b[37m?\x1b[0m"]);
    }

    output += table.toString();
    output += "\n\n";

    return output;
  }

  buildFooter() {
    const flashStr = this.noFlash ? " 🚫no-flash" : "";

    return `\x1b[90mh=help • q=quit${flashStr}\x1b[0m\n`;
  }

  // ============================================================================
  // USER INPUT
  // ============================================================================

  setupInput() {
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
    }

    process.stdin.on("data", (key) => {
      switch (key) {
        case "q":
        case "\u0003": // Ctrl+C
          this.stop();
          break;
        case "n":
          this.noFlash = !this.noFlash;
          if (!this.noFlash) this.firstRender = true;
          this.refresh();
          break;
        case "h":
          this.displayHelp();
          break;
      }
    });
  }

  displayHelp() {
    console.log("\x1b[1m🎮 ACTIVITY MONITOR CONTROLS\x1b[0m");
    console.log("\x1b[90m─────────────────────────────\x1b[0m");
    console.log("\x1b[33mn\x1b[0m - Toggle no-flash mode");
    console.log("\x1b[90mh\x1b[0m - Help • \x1b[31mq\x1b[0m - Quit");
    console.log("");
    setTimeout(() => this.refresh(), 3000);
  }

  // ============================================================================
  // INITIAL DATA FETCH
  // ============================================================================

  async fetchInitialData() {
    try {
      const response = await fetch("https://data.cmem.ai/api/activity/top/50");
      const data = await response.json();
      if (data.success && Array.isArray(data.activeTokens)) {
        this.topTokens = data.activeTokens;
        this.updateCount = 1;
        this.processTokens();
        this.refresh();
      }
    } catch (error) {
      // Ignore, will get data from WebSocket
    }
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  async start() {
    this.isRunning = true;
    this.setupInput();

    // Get initial data immediately via REST
    await this.fetchInitialData();

    // Then connect WebSocket for live updates
    this.connectWebSocket();
  }

  stop() {
    this.isRunning = false;

    if (this.ws) {
      this.ws.close();
    }

    console.log("\n\x1b[33m👋 Activity Monitor stopped\x1b[0m");
    process.exit(0);
  }
}

// ============================================================================
// MAIN
// ============================================================================

const args = process.argv.slice(2);

// Parse --rows flag
let displayRows = 15;
const rowsIndex = args.findIndex(arg => arg === '--rows');
if (rowsIndex !== -1 && args[rowsIndex + 1]) {
  const rows = parseInt(args[rowsIndex + 1]);
  if (!isNaN(rows) && rows > 0 && rows <= 100) {
    displayRows = rows;
  }
}

const monitor = new ActivityMonitor(displayRows);

if (args.includes("--help") || args.includes("-h")) {
  console.log("Activity Monitor - Real-time token activity tracking");
  console.log("");
  console.log("Usage: node activity-monitor.js [options]");
  console.log("");
  console.log("Options:");
  console.log("  --rows <number>    Number of tokens to display (default: 15, max: 100)");
  console.log("  --flash            Enable screen flashing");
  console.log("  --help, -h         Show this help");
  process.exit(0);
}

if (args.includes("--flash")) {
  monitor.noFlash = false;
}

// Handle shutdown
process.on("SIGINT", () => monitor.stop());
process.on("SIGTERM", () => monitor.stop());

// Start
monitor.start();

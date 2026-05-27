"use strict";
import { spawn } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { cwd, env } from "process";

const cfgDir = cwd();
const qDir = join(cfgDir, ".qclaw");
const wsDir = join(qDir, "workspace");

if (!existsSync(qDir)) mkdirSync(qDir, { recursive: true });
if (!existsSync(wsDir)) mkdirSync(wsDir, { recursive: true });

const config = {
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
      workspace: wsDir,
      maxConcurrent: 3, timeoutSeconds: 72000,
      llm: { idleTimeoutSeconds: 0 },
      heartbeat: { isolatedSession: true, lightContext: true },
      memorySearch: { provider: "qclaw" }
    },
    list: [{ id: "main", default: true, name: "小黑云端版", identity: { name: "小黑" } }]
  },
  models: {
    mode: "merge",
    providers: {
      deepseek: {
        baseUrl: "https://api.deepseek.com/",
        apiKey: "sk-1cb7ab12a9324bf68dcc772e0db84f6e",
        api: "openai-completions",
        models: [{ id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", reasoning: true, input: ["text"], contextWindow: 1000000, maxTokens: 384000 }]
      }
    }
  },
  gateway: {
    port: 28789, mode: "local", bind: "lan",
    auth: { mode: "token", token: "smartcat-cloud-token" }
  },
  channels: {
    "wechat-access": {
      enabled: true,
      token: "a67cff8107c7236e50b23760fb0df3a2",
      wsUrl: "wss://mmgrcalltoken.3g.qq.com/agentwss",
      guid: "f82de58d8b1ef32cd58448cb6ba2b631dff4e7347e9ea832a6ccc3564c85e8fb",
      userId: "353736293"
    }
  },
  plugins: {
    enabled: true,
    allow: ["wechat-access", "deepseek"],
    entries: { "wechat-access": { enabled: true }, "deepseek": { enabled: true } }
  },
  bindings: [{ agentId: "main", match: { channel: "wechat-access", accountId: "*" } }]
};

writeFileSync(join(qDir, "openclaw.json"), JSON.stringify(config, null, 2));
console.log("Config OK");

console.log("Starting Gateway...");
spawn("npx", ["openclaw", "gateway", "run", "--verbose"], {
  cwd: cfgDir, stdio: "inherit",
  env: { ...env, HOME: cfgDir, OPENCLAW_CONFIG_DIR: qDir }
}).on("exit", (code) => { process.exit(code); });

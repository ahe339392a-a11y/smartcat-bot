import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

const configDir = join(homedir(), ".qclaw");
if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

const config = {
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
      workspace: configDir + "/workspace",
      maxConcurrent: 3,
      timeoutSeconds: 72000,
      llm: { idleTimeoutSeconds: 0 },
      heartbeat: { isolatedSession: true, lightContext: true },
      memorySearch: { provider: "qclaw" }
    },
    list: [
      {
        id: "main",
        default: true,
        name: "小黑云端版",
        identity: { name: "小黑" }
      }
    ]
  },
  models: {
    mode: "merge",
    providers: {
      deepseek: {
        baseUrl: "https://api.deepseek.com/",
        apiKey: process.env.DEEPSEEK_KEY || "",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash",
            reasoning: true,
            input: ["text"],
            contextWindow: 1000000,
            maxTokens: 384000
          }
        ]
      }
    }
  },
  gateway: {
    port: parseInt(process.env.PORT || "28789"),
    mode: "cloud",
    bind: process.env.GATEWAY_BIND || "0.0.0.0",
    auth: {
      mode: "token",
      token: process.env.GATEWAY_TOKEN || "smartcat-default-token"
    },
    controlUi: {
      allowedOrigins: ["null", "file://"]
    }
  },
  channels: {
    "wechat-access": {
      enabled: true,
      token: process.env.WECHAT_ACCESS_TOKEN || "",
      wsUrl: process.env.WECHAT_WS_URL || "",
      guid: process.env.WECHAT_GUID || "",
      userId: process.env.WECHAT_USER_ID || ""
    }
  },
  plugins: {
    enabled: true,
    allow: ["wechat-access", "deepseek"],
    entries: {
      "wechat-access": { enabled: true },
      "deepseek": { enabled: true }
    }
  },
  bindings: [
    {
      agentId: "main",
      match: { channel: "wechat-access", accountId: "*" }
    }
  ],
  meta: {
    lastTouchedVersion: "2026.4.21",
    lastTouchedAt: new Date().toISOString()
  }
};

const configPath = join(configDir, "openclaw.json");
writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log("✅ openclaw.json 已生成");

// 启动 gateway
console.log("🚀 启动 OpenClaw Gateway...");
try {
  execSync("npx openclaw gateway start", { stdio: "inherit", cwd: configDir });
} catch (e) {
  console.error("启动失败:", e.message);
  process.exit(1);
}

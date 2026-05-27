#!/usr/bin/env python3
"""
小黑 Telegram Bot - 轻量版
接 DeepSeek API，白名单限制
"""

import os
import asyncio
import logging
import openai
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# === 配置 ===
BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
DEEPSEEK_KEY = os.environ.get("DEEPSEEK_KEY", "")
ALLOWED_IDS = set()
raw_ids = os.environ.get("ALLOWED_IDS", "")
for uid in raw_ids.split(","):
    uid = uid.strip()
    if uid:
        try:
            ALLOWED_IDS.add(int(uid))
        except ValueError:
            pass

if not BOT_TOKEN or not DEEPSEEK_KEY:
    logger.error("请设置 BOT_TOKEN 和 DEEPSEEK_KEY 环境变量")
    exit(1)

client = openai.AsyncOpenAI(
    api_key=DEEPSEEK_KEY,
    base_url="https://api.deepseek.com/v1"
)

SYSTEM_PROMPT = "你是一个可爱的 AI 助手，名字叫小黑。回答问题简洁有爱，适当使用 emoji 表情。"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    if uid not in ALLOWED_IDS:
        await update.message.reply_text("😸 抱歉，你不在白名单里哦～")
        return
    await update.message.reply_text("😸 喵～ 小黑上线啦！有什么想问的？")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = update.effective_user.id
    if uid not in ALLOWED_IDS:
        await update.message.reply_text("😸 抱歉，你不在白名单里哦～")
        return
    
    user_text = update.message.text
    if not user_text:
        return
    
    try:
        await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
        
        response = await client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_text}
            ],
            temperature=0.7,
            max_tokens=8192
        )
        
        reply = response.choices[0].message.content
        await update.message.reply_text(reply)
        
    except Exception as e:
        logger.error(f"错误: {e}")
        await update.message.reply_text("😿 啊呀，小黑卡住了，等会儿再问吧～")

def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    logger.info("小黑已上线 🐱")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()

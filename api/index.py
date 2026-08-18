import os
import logging
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telegram import Update, Bot, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes

from .db import save_group_binding, get_group_binding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ENV Variables
BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
BOT_USERNAME = os.environ.get("BOT_USERNAME", "")
MINI_APP_SHORT_NAME = os.environ.get("MINI_APP_SHORT_NAME", "")

app = FastAPI(title="ICOS Serverless API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- BOT LOGIC ---
def mini_app_url(start_param: str = "calcul") -> str:
    return f"https://t.me/{BOT_USERNAME}/{MINI_APP_SHORT_NAME}?startapp={start_param}"

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [[InlineKeyboardButton("🧮 OUVRIR ICOS CALCULATOR", url=mini_app_url("calcul"))]]
    await update.message.reply_text(
        "📊 ICOS\n\nAnalysez la rentabilité de votre produit.",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )

async def bind_calcul_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    message = update.effective_message
    chat = update.effective_chat
    thread_id = message.message_thread_id
    
    success = await save_group_binding(chat.id, thread_id, "📚 Calcul")
    if not success:
        await message.reply_text("❌ Erreur lors de l'enregistrement du topic.")
        return

    keyboard = [[InlineKeyboardButton("🚀 OUVRIR LE CALCULATEUR", url=mini_app_url("calcul"))]]
    await message.reply_text(
        "🧮 ICOS\n\n"
        "Analysez la rentabilité de votre produit en quelques secondes.\n\n"
        "👇 Lancez le calculateur",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )

# Construction de l'Application PTB (sans polling, pour webhook)
ptb_app = Application.builder().token(BOT_TOKEN).build()
ptb_app.add_handler(CommandHandler("start", start_command))
ptb_app.add_handler(CommandHandler("bind_calcul", bind_calcul_command))

# --- FASTAPI ROUTES ---
@app.get("/api/health")
def health_check():
    return {"status": "ok", "serverless": True}

@app.post("/api/webhook")
async def telegram_webhook(request: Request):
    """Reçoit les updates de Telegram."""
    if not ptb_app._initialized:
        await ptb_app.initialize()
    
    update_data = await request.json()
    update = Update.de_json(update_data, ptb_app.bot)
    
    await ptb_app.process_update(update)
    return {"status": "ok"}

class ShareCalculationRequest(BaseModel):
    initData: str
    summary_text: str

@app.post("/api/share")
async def share_calculation(request: ShareCalculationRequest):
    binding = await get_group_binding()
    if not binding:
        raise HTTPException(status_code=404, detail="No Telegram topic bound yet.")
    
    try:
        bot = Bot(token=BOT_TOKEN)
        await bot.send_message(
            chat_id=binding["chat_id"],
            message_thread_id=binding["thread_id"],
            text=request.summary_text,
            parse_mode="HTML"
        )
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error sending message to topic: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message to Telegram.")

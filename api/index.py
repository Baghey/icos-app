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
MINI_APP_SHORT_NAME = os.environ.get("MINI_APP_SHORT_NAME", "ICOS")

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

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "🤖 **COMMANDES ICOS PRO**\n\n"
        "• `/bind_calcul` : Lie ce topic au calculateur et affiche le bouton d'accès.\n"
        "• `/app` : Affiche le bouton d'ouverture du calculateur visual ICOS.\n"
        "• `/quick <prix_vente> <prix_achat>` : Effectue un calcul rapide directement en texte !\n"
        "  *(Exemple: `/quick 6000 2000`)*\n"
        "• `/help` : Affiche ce menu d'aide."
    )
    await update.message.reply_text(text, parse_mode="Markdown")

async def quick_calc_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    args = context.args
    if len(args) < 2:
        await update.message.reply_text("⚠️ Usage: `/quick <prix_vente> <prix_achat>`\nExemple: `/quick 6000 2000`", parse_mode="Markdown")
        return
    try:
        pv = float(args[0])
        pa = float(args[1])
        conf_rate = 0.70
        deliv_rate = 0.50
        shipping = 700
        ret_fee = 250
        cpa_dzd = 600  # ~2.5$
        
        # Estimation rapide
        livres = conf_rate * deliv_rate
        retours = conf_rate * (1 - deliv_rate)
        
        rev = pv * livres
        ops = (pa * livres) + (shipping * livres) + (ret_fee * retours) + cpa_dzd
        profit = rev - ops
        margin = (profit / rev * 100) if rev > 0 else 0
        
        resp = (
            f"⚡ **CALCUL RAPIDE (Estimatif 70% Conf / 50% Deliv)**\n"
            f"• Prix Vente: `{pv}` DZD\n"
            f"• Prix Achat: `{pa}` DZD\n"
            f"-------------------\n"
            f"📈 Bénéfice Net Estimé: `{int(profit)} DZD` / lead\n"
            f"📊 Marge Nette Estimée: `{margin:.1f}%`"
        )
        await update.message.reply_text(resp, parse_mode="Markdown")
    except ValueError:
        await update.message.reply_text("❌ Veuillez entrer des chiffres valides. Exemple: `/quick 6000 2000`")

# Construction de l'Application PTB (sans polling, pour webhook)
ptb_app = Application.builder().token(BOT_TOKEN).build()
ptb_app.add_handler(CommandHandler("start", start_command))
ptb_app.add_handler(CommandHandler("app", start_command))
ptb_app.add_handler(CommandHandler("calcul", start_command))
ptb_app.add_handler(CommandHandler("bind_calcul", bind_calcul_command))
ptb_app.add_handler(CommandHandler("help", help_command))
ptb_app.add_handler(CommandHandler("aide", help_command))
ptb_app.add_handler(CommandHandler("quick", quick_calc_command))

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

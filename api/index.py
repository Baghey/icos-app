import os
import json
import logging
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .db import save_group_binding, get_group_binding

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ENV Variables
BOT_TOKEN = os.environ.get("BOT_TOKEN", "8817398388:AAGNbiqjWTC83GPoXIfePC3bzVxVYWmzNBU")
BOT_USERNAME = os.environ.get("BOT_USERNAME", "Icosecombot")
MINI_APP_SHORT_NAME = os.environ.get("MINI_APP_SHORT_NAME", "ICOS")

app = FastAPI(title="ICOS Serverless API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def mini_app_url(start_param: str = "calcul") -> str:
    return f"https://t.me/{BOT_USERNAME}/{MINI_APP_SHORT_NAME}?startapp={start_param}"

async def send_telegram_message(chat_id: int | str, text: str, thread_id: int = None, reply_markup: dict = None):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    }
    if thread_id:
        payload["message_thread_id"] = thread_id
    if reply_markup:
        payload["reply_markup"] = reply_markup
        
    async with httpx.AsyncClient() as client:
        res = await client.post(url, json=payload)
        logger.info(f"Telegram response: {res.status_code} {res.text}")
        return res.is_success

@app.get("/api/health")
def health_check():
    return {"status": "ok", "serverless": True, "has_token": bool(BOT_TOKEN)}

@app.post("/api/webhook")
async def telegram_webhook(request: Request):
    """Reçoit et traite directement les updates Telegram."""
    try:
        update_data = await request.json()
        logger.info(f"Webhook update: {json.dumps(update_data)}")
        
        message = update_data.get("message") or update_data.get("edited_message")
        if not message:
            return {"status": "ignored"}
            
        text = message.get("text", "").strip()
        chat = message.get("chat", {})
        chat_id = chat.get("id")
        thread_id = message.get("message_thread_id")
        
        if not text or not chat_id:
            return {"status": "no_text_or_chat"}

        # Commandes
        cmd = text.split()[0].lower()
        cmd_name = cmd.split("@")[0]  # Gère /quick@Icosecombot

        keyboard_button = {
            "inline_keyboard": [[
                {"text": "🚀 OUVRIR LE CALCULATEUR", "web_app": {"url": "https://icos-app.vercel.app/"}}
            ]]
        }

        if cmd_name in ["/start", "/app", "/calcul"]:
            msg = "🧮 **ICOS CALCULATOR**\n\nAnalysez la rentabilité de votre produit e-commerce COD."
            await send_telegram_message(chat_id, msg, thread_id, keyboard_button)

        elif cmd_name == "/bind_calcul":
            await save_group_binding(chat_id, thread_id, "📚 Calcul")
            msg = (
                "🧮 **ICOS PRO**\n\n"
                "Ce topic est maintenant configuré pour le calculateur de rentabilité.\n\n"
                "👇 Cliquez ci-dessous pour lancer l'application :"
            )
            await send_telegram_message(chat_id, msg, thread_id, keyboard_button)

        elif cmd_name in ["/help", "/aide"]:
            msg = (
                "🤖 **COMMANDES ICOS PRO**\n\n"
                "• `/bind_calcul` : Lie ce topic au calculateur et affiche le bouton.\n"
                "• `/app` : Affiche le bouton d'ouverture du calculateur.\n"
                "• `/quick <prix_vente> <prix_achat>` : Calcul rapide en texte !\n"
                "  *(Exemple: `/quick 6000 2000`)*\n"
                "• `/help` : Affiche ce menu."
            )
            await send_telegram_message(chat_id, msg, thread_id)

        elif cmd_name == "/quick":
            parts = text.split()
            if len(parts) < 3:
                await send_telegram_message(chat_id, "⚠️ Usage: `/quick <prix_vente> <prix_achat>`\nExemple: `/quick 6000 2000`", thread_id)
            else:
                try:
                    pv = float(parts[1])
                    pa = float(parts[2])
                    conf_rate = 0.70
                    deliv_rate = 0.50
                    shipping = 700
                    ret_fee = 250
                    cpa_dzd = 600
                    
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
                    await send_telegram_message(chat_id, resp, thread_id)
                except ValueError:
                    await send_telegram_message(chat_id, "❌ Chiffres invalides. Exemple: `/quick 6000 2000`", thread_id)

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error handling webhook: {e}", exc_info=True)
        return {"status": "error", "detail": str(e)}

class ShareCalculationRequest(BaseModel):
    initData: str
    summary_text: str

@app.post("/api/share")
async def share_calculation(request: ShareCalculationRequest):
    binding = await get_group_binding()
    if not binding:
        raise HTTPException(status_code=404, detail="No Telegram topic bound yet.")
    
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        payload = {
            "chat_id": binding["chat_id"],
            "text": request.summary_text,
            "parse_mode": "HTML"
        }
        if binding.get("thread_id"):
            payload["message_thread_id"] = binding["thread_id"]
            
        async with httpx.AsyncClient() as client:
            res = await client.post(url, json=payload)
            if res.is_success:
                return {"status": "success"}
            else:
                raise Exception(res.text)
    except Exception as e:
        logger.error(f"Error sending message to topic: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message to Telegram.")

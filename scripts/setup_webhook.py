import os
import asyncio
from telegram import Bot

BOT_TOKEN = os.environ.get("BOT_TOKEN")
# Remplacez par l'URL de votre application Vercel déployée
WEBHOOK_URL = os.environ.get("WEBHOOK_URL", "https://votre-app.vercel.app/api/webhook")

async def main():
    if not BOT_TOKEN:
        print("Erreur: BOT_TOKEN n'est pas défini dans les variables d'environnement.")
        return

    bot = Bot(token=BOT_TOKEN)
    print(f"Configuration du webhook vers: {WEBHOOK_URL}")
    
    success = await bot.set_webhook(url=WEBHOOK_URL)
    
    if success:
        print("✅ Webhook configuré avec succès !")
    else:
        print("❌ Échec de la configuration du webhook.")

if __name__ == "__main__":
    asyncio.run(main())

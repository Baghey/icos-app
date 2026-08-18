import os
import json
import redis.asyncio as redis
import logging

logger = logging.getLogger(__name__)

# Sur Vercel, les variables d'environnement KV_URL ou KV_REST_API_URL seront injectées
KV_URL = os.environ.get("KV_URL", "redis://localhost:6379")

# Singleton Redis client
_redis_client = None

def get_redis():
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(KV_URL, decode_responses=True)
    return _redis_client

async def save_group_binding(chat_id: int, thread_id: int, topic_name: str):
    client = get_redis()
    data = {
        "chat_id": chat_id,
        "thread_id": thread_id,
        "topic_name": topic_name
    }
    try:
        # On sauvegarde le binding principal (clé unique pour l'instant)
        await client.set("main_group_binding", json.dumps(data))
        return True
    except Exception as e:
        logger.error(f"Error saving to Redis KV: {e}")
        return False

async def get_group_binding():
    client = get_redis()
    try:
        data_str = await client.get("main_group_binding")
        if data_str:
            return json.loads(data_str)
        return None
    except Exception as e:
        logger.error(f"Error reading from Redis KV: {e}")
        return None

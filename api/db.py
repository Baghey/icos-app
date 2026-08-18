import os
import json
import logging

logger = logging.getLogger(__name__)

# In-memory fallback
_in_memory_binding = None

async def save_group_binding(chat_id: int, thread_id: int, topic_name: str):
    global _in_memory_binding
    data = {
        "chat_id": chat_id,
        "thread_id": thread_id,
        "topic_name": topic_name
    }
    _in_memory_binding = data
    
    kv_url = os.environ.get("KV_URL") or os.environ.get("REDIS_URL")
    if kv_url:
        try:
            import redis.asyncio as redis
            client = redis.from_url(kv_url, decode_responses=True)
            await client.set("main_group_binding", json.dumps(data))
            await client.aclose()
        except Exception as e:
            logger.error(f"Error saving to Redis KV: {e}")
    
    return True

async def get_group_binding():
    global _in_memory_binding
    kv_url = os.environ.get("KV_URL") or os.environ.get("REDIS_URL")
    if kv_url:
        try:
            import redis.asyncio as redis
            client = redis.from_url(kv_url, decode_responses=True)
            data_str = await client.get("main_group_binding")
            await client.aclose()
            if data_str:
                return json.loads(data_str)
        except Exception as e:
            logger.error(f"Error reading from Redis KV: {e}")
    
    return _in_memory_binding

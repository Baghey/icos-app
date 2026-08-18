// frontend/src/lib/telegram.ts
import WebApp from '@twa-dev/sdk';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: any;
    };
  }
}

export const isTelegram = typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData !== '';

export const initTelegram = () => {
  if (isTelegram) {
    WebApp.ready();
    WebApp.expand();
  }
};

export const getCloudStorageItem = async (key: string): Promise<string | null> => {
  if (!isTelegram) {
    return localStorage.getItem(key);
  }
  return new Promise((resolve) => {
    WebApp.CloudStorage.getItem(key, (err, value) => {
      if (err) {
        console.error('CloudStorage Error:', err);
        resolve(null);
      } else {
        resolve(value || null);
      }
    });
  });
};

export const setCloudStorageItem = async (key: string, value: string): Promise<boolean> => {
  if (!isTelegram) {
    localStorage.setItem(key, value);
    return true;
  }
  return new Promise((resolve) => {
    WebApp.CloudStorage.setItem(key, value, (err, success) => {
      if (err) {
        console.error('CloudStorage Error:', err);
        resolve(false);
      } else {
        resolve(!!success);
      }
    });
  });
};

export const shareToTopic = async (summaryText: string) => {
  // In a real app with backend, this calls the FastAPI backend
  try {
    const initData = isTelegram ? WebApp.initData : '';
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData, summary_text: summaryText }),
    });
    return res.ok;
  } catch (e) {
    console.error(e);
    return false;
  }
};

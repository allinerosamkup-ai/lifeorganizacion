import { useState, useEffect } from 'react';
import { supabase } from './supabase';

type PushStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications(userId?: string) {
  const [status, setStatus] = useState<PushStatus>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('Notification' in window)) {
      setStatus('unsupported');
      return;
    }
    setStatus(Notification.permission as PushStatus);
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return false;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      setStatus(permission as PushStatus);

      if (permission === 'granted' && userId) {
        await saveSubscription(userId);
      }
      return permission === 'granted';
    } catch (err) {
      console.error('[Push] requestPermission error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveSubscription = async (uid: string) => {
    try {
      const reg = await navigator.serviceWorker.ready;
      // In production: use VAPID public key from env
      // For now, just save that push is enabled for this user
      const existing = await reg.pushManager.getSubscription();
      const subscription = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        // VAPID key would go here: applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      }).catch(() => null);

      if (subscription) {
        await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: uid,
            endpoint: subscription.endpoint,
            subscription_json: JSON.stringify(subscription),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      }
    } catch {
      // Push subscription requires VAPID key — skip silently in dev
      console.log('[Push] Subscription skipped (no VAPID key configured)');
    }
  };

  const sendTestNotification = () => {
    if (status !== 'granted') return;
    new Notification('Airia Flow 🌊', {
      body: 'Notificações ativadas! Você receberá lembretes personalizados.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
    });
  };

  return { status, loading, requestPermission, sendTestNotification };
}

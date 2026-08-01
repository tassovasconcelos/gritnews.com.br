import { AnalyticsEvent } from '../types';

const ANALYTICS_STORAGE_KEY = 'grit_news_analytics_events_v1';

export function trackEvent(
  eventType: string,
  data?: {
    articleId?: string;
    offerId?: string;
    adId?: string;
    categorySlug?: string;
    metadata?: Record<string, any>;
  }
): void {
  const event: AnalyticsEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    eventType,
    articleId: data?.articleId,
    offerId: data?.offerId,
    adId: data?.adId,
    categorySlug: data?.categorySlug,
    pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString(),
    metadata: data?.metadata
  };

  try {
    // 1. Save locally
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    const events: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    events.unshift(event);
    // Keep max 500 events
    if (events.length > 500) events.pop();
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events));

    // 2. Beacon to API
    if (typeof fetch !== 'undefined') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(() => {
        // Silent catch for dev/offline
      });
    }
  } catch (err) {
    console.error('Failed to track analytics event:', err);
  }
}

export function getLocalEvents(): AnalyticsEvent[] {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

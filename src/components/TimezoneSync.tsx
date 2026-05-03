'use client';
import { useEffect } from 'react';

/**
 * Detects the browser's timezone (e.g. "Asia/Tokyo") and syncs it
 * to the server so the WhatsApp bot uses the correct local time.
 * Runs once on mount; re-syncs if the user travels to a new timezone.
 */
export default function TimezoneSync() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;

    // Only POST if it changed from what we last sent
    const lastSent = sessionStorage.getItem('noto_tz');
    if (lastSent === tz) return;

    fetch('/api/settings/timezone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: tz }),
    }).then(() => {
      sessionStorage.setItem('noto_tz', tz);
    }).catch(() => {});
  }, []);

  return null; // Renders nothing
}

import Constants from 'expo-constants';

export type CalendarSyncAction = 'create' | 'update' | 'cancel';

export interface CalendarSyncRequest {
  title: string;
  description?: string;
  start: string;
  end?: string;
  attendees: string[];
  organizer: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  ownerEventId?: string | null;
  sharedEventId?: string | null;
}

export interface CalendarSyncResult {
  ownerEventId?: string | null;
  sharedEventId?: string | null;
}

const SHARED_CALENDAR_EMAIL = 'meeting@gmail.com';

const CALENDAR_SYNC_ENDPOINT =
  Constants.expoConfig?.extra?.calendarSyncUrl ||
  process.env.EXPO_PUBLIC_CALENDAR_SYNC_URL ||
  '';

const postCalendarAction = async (
  action: CalendarSyncAction,
  payload: Record<string, unknown>
): Promise<CalendarSyncResult | null> => {
  if (!CALENDAR_SYNC_ENDPOINT) {
    console.warn('Calendar sync endpoint is not configured.');
    return null;
  }

  try {
    const response = await fetch(CALENDAR_SYNC_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Calendar sync request failed (${response.status}): ${errorText}`);
    }

    try {
      const data = (await response.json()) as CalendarSyncResult;
      return data ?? null;
    } catch (error) {
      console.warn('Calendar sync response was not JSON:', error);
      return null;
    }
  } catch (error) {
    console.error('Calendar sync error:', error);
    return null;
  }
};

export const createCalendarEvents = async (
  payload: CalendarSyncRequest
): Promise<CalendarSyncResult | null> => postCalendarAction('create', payload);

export const updateCalendarEvents = async (
  payload: CalendarSyncRequest
): Promise<CalendarSyncResult | null> => postCalendarAction('update', payload);

export const cancelCalendarEvents = async (
  payload: Pick<CalendarSyncRequest, 'ownerEventId' | 'sharedEventId'> & { reason?: string }
): Promise<CalendarSyncResult | null> => postCalendarAction('cancel', payload);

export const hasCalendarSync = (): boolean => Boolean(CALENDAR_SYNC_ENDPOINT);

export const getSharedCalendarEmail = (): string => SHARED_CALENDAR_EMAIL;

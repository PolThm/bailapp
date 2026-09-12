/**
 * Analytics utilities for PostHog tracking
 */

import { PostHog } from 'posthog-js';

/**
 * Event names enum for consistent tracking
 */
export const AnalyticsEvents = {
  // Navigation events
  HOME_CARD_CLICKED: 'home_card_clicked',
  FIGURE_VIEWED: 'figure_viewed',
  FIGURE_FAVORITED: 'figure_favorited',
  FIGURE_UNFAVORITED: 'figure_unfavorited',

  // User actions
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  CHOREOGRAPHY_CREATED: 'choreography_created',
  FIGURE_CREATED: 'figure_created',

  // Video upload funnel. `drop_console: true` strips console.error in
  // production, so these are the only visibility into upload failures.
  VIDEO_UPLOAD_STARTED: 'video_upload_started',
  VIDEO_COMPRESSION_COMPLETED: 'video_compression_completed',
  VIDEO_UPLOAD_COMPLETED: 'video_upload_completed',
  VIDEO_UPLOAD_FAILED: 'video_upload_failed',
  FIGURE_SUBMITTED_FOR_REVIEW: 'figure_submitted_for_review',
  FIGURE_DELETED: 'figure_deleted',

  // Auth events
  USER_SIGNED_IN: 'user_signed_in',
  USER_SIGNED_OUT: 'user_signed_out',
  USER_SIGNED_UP: 'user_signed_up',
} as const;

export type AnalyticsEventName = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/**
 * Capture an analytics event with PostHog
 */
export function trackEvent(
  posthog: PostHog | null | undefined,
  eventName: AnalyticsEventName,
  properties?: Record<string, any>
) {
  if (!posthog) {
    console.warn('[Analytics] PostHog not initialized, skipping event:', eventName);
    return;
  }

  posthog.capture(eventName, properties);

  if (import.meta.env.DEV) {
    console.log('[Analytics] Event tracked:', eventName, properties);
  }
}

/**
 * Identify a user in PostHog
 */
export function identifyUser(
  posthog: PostHog | null | undefined,
  userId: string,
  properties?: Record<string, any>
) {
  if (!posthog) {
    console.warn('[Analytics] PostHog not initialized, skipping identify');
    return;
  }

  posthog.identify(userId, properties);

  if (import.meta.env.DEV) {
    console.log('[Analytics] User identified:', userId, properties);
  }
}

/**
 * Reset PostHog (useful on logout)
 */
export function resetAnalytics(posthog: PostHog | null | undefined) {
  if (!posthog) {
    console.warn('[Analytics] PostHog not initialized, skipping reset');
    return;
  }

  posthog.reset();

  if (import.meta.env.DEV) {
    console.log('[Analytics] Analytics reset');
  }
}

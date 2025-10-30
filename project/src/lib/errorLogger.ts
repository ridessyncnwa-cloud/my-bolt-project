import { supabase } from './supabase';

export async function logError(
  error: Error | string,
  severity: 'error' | 'warning' | 'info' = 'error'
) {
  try {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? null : error.stack;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('error_logs').insert({
      error_message: errorMessage,
      error_stack: errorStack,
      user_id: user?.id || null,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
      severity,
    });
  } catch (err) {
    console.error('Failed to log error to database:', err);
  }
}

export function setupGlobalErrorHandler() {
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    logError(event.reason, 'error');
  });
}

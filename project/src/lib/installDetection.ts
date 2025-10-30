import { supabase } from './supabase';

export const detectAppInstall = (userId?: string) => {
  if (typeof window === 'undefined') return;

  window.addEventListener('appinstalled', async () => {
    console.log('PWA was installed');

    localStorage.setItem('pwa_installed', 'true');
    localStorage.setItem('pwa_install_date', new Date().toISOString());

    if (userId) {
      await supabase
        .from('profiles')
        .update({
          pwa_installed: true,
          pwa_installed_at: new Date().toISOString()
        })
        .eq('id', userId);
    }

    if ('gtag' in window) {
      (window as any).gtag('event', 'app_installed', {
        event_category: 'engagement',
        event_label: 'PWA Installed',
      });
    }
  });

  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App is running in standalone mode');
    localStorage.setItem('pwa_standalone', 'true');

    if (userId && localStorage.getItem('pwa_installed') !== 'true') {
      localStorage.setItem('pwa_installed', 'true');
      localStorage.setItem('pwa_install_date', new Date().toISOString());

      supabase
        .from('profiles')
        .update({
          pwa_installed: true,
          pwa_installed_at: new Date().toISOString()
        })
        .eq('id', userId);
    }
  }

  window.matchMedia('(display-mode: standalone)').addEventListener('change', async (e) => {
    if (e.matches) {
      console.log('App entered standalone mode');
      localStorage.setItem('pwa_standalone', 'true');

      if (userId) {
        await supabase
          .from('profiles')
          .update({
            pwa_installed: true,
            pwa_installed_at: new Date().toISOString()
          })
          .eq('id', userId);
      }
    }
  });
};

export const isAppInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    localStorage.getItem('pwa_installed') === 'true' ||
    (window.navigator as any).standalone === true
  );
};

export const getInstallDate = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pwa_install_date');
};

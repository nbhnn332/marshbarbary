/**
 * MARSH BARBARY — SUPABASE CONFIGURATION (js/supabase-config.js)
 * Central credentials and environment configuration for Supabase integration.
 * Allows override via localStorage ('mb_supabase_url', 'mb_supabase_anon_key')
 * or global window.MB_SUPABASE_CONFIG.
 */

window.MB_SUPABASE_CONFIG = (() => {
  // Default project credentials (connected to live Supabase project)
  const defaultUrl = 'https://vsoannpuvffvaywqacot.supabase.co';
  const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzb2FubnB1dmZmdmF5d3FhY290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NjkyMDcsImV4cCI6MjEwNTI0NTIwN30.ccYPpHvpOBdM-JL2hHnS1DV6WucfVlaGHlHLulLEklU';
  const defaultPublishableKey = 'sb_publishable_J9yq2zdg1i6UFGzzIlMT2Q_cO_toPss';

  function cleanBaseUrl(url) {
    if (!url) return '';
    return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }

  // Support optional window injected env or overrides
  const envUrl = (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.VITE_SUPABASE_URL) ||
                 (typeof window !== 'undefined' && window.VITE_SUPABASE_URL) || null;
  const envAnonKey = (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.VITE_SUPABASE_ANON_KEY) ||
                     (typeof window !== 'undefined' && window.VITE_SUPABASE_ANON_KEY) || null;
  const envPublishableKey = (typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.VITE_SUPABASE_PUBLISHABLE_KEY) ||
                            (typeof window !== 'undefined' && window.VITE_SUPABASE_PUBLISHABLE_KEY) || null;

  const storedUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('mb_supabase_url') : null;
  const storedAnonKey = typeof localStorage !== 'undefined' ? localStorage.getItem('mb_supabase_anon_key') : null;

  return {
    url: cleanBaseUrl(storedUrl || envUrl || defaultUrl),
    anonKey: storedAnonKey || envAnonKey || defaultAnonKey,
    publishableKey: envPublishableKey || defaultPublishableKey,

    // Helper to check if live configured
    isLiveConfigured() {
      return (
        Boolean(this.url) &&
        !this.url.includes('marsh-barbary.supabase.co') &&
        Boolean(this.anonKey) &&
        !this.anonKey.includes('placeholder-anon-key')
      );
    },

    // Method to update configuration dynamically
    setCredentials(url, anonKey) {
      const cleaned = cleanBaseUrl(url);
      if (typeof localStorage !== 'undefined') {
        if (cleaned) localStorage.setItem('mb_supabase_url', cleaned);
        if (anonKey) localStorage.setItem('mb_supabase_anon_key', anonKey);
      }
      this.url = cleaned || this.url;
      this.anonKey = anonKey || this.anonKey;
    }
  };
})();

window.MB_FALLBACK_SVG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjUwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iI0Y0RUZFQSIvPjxwYXRoIGQ9Ik03MCAzMCBRMTAwIDUwIDEzMCAzMCBMMTYwIDcwIEwxNDAgODUgTDEzMCA3NSBMMTM1IDIyMCBMNjUgMjIwIEw3MCA3NSBMNjAgODUgTDQwIDcwIFoiIGZpbGw9IiNENUNCQzIiIHN0cm9rZT0iI0I0NzE1NCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHRleHQgeD0iMTAwIiB5PSIxNDUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjExIiBmaWxsPSIjOEM3QTZCIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXdlaWdodD0iNjAwIj5BVEVMSUVSIFBJRUNFPC90ZXh0Pjwvc3ZnPg==";


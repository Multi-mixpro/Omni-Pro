export const APP_CONFIG = {
  name: 'GG Product OS',
  version: '1.0.0',
  description: 'Operating System Launching Artikel GG Supply & GUDSKUY',
};

export const FEATURE_FLAGS = {
  PRODUCT_LAUNCH: import.meta.env.VITE_ENABLE_PRODUCT_LAUNCH !== 'false',
  CATALOG: import.meta.env.VITE_ENABLE_CATALOG !== 'false',
  ATTENDANCE: import.meta.env.VITE_ENABLE_ATTENDANCE === 'true',
  POS_SELLER: import.meta.env.VITE_ENABLE_POS_SELLER === 'true',
};

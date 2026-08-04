/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_ENABLE_PRODUCT_LAUNCH: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

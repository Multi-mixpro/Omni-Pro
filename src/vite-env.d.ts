/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CLOUDINARY_CLOUD_NAME: string;
  readonly VITE_CLOUDINARY_UPLOAD_PRESET: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_ENABLE_PRODUCT_LAUNCH: string;
  readonly VITE_ENABLE_CATALOG: string;
  readonly VITE_ENABLE_ATTENDANCE: string;
  readonly VITE_ENABLE_POS_SELLER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

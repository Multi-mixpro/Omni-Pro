import { ReactNode, useEffect, useState } from 'react';

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  fallback: ReactNode;
}

export function SafeImage({ src, alt, fallback }: SafeImageProps) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [src]);
  if (!src || broken) return <>{fallback}</>;
  return <img src={src} alt={alt} onError={() => setBroken(true)} />;
}

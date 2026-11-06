import { useState } from 'react';
import { Facebook, Globe2, Instagram, Link2, MessageCircle, Music2, ShoppingBag, Youtube } from 'lucide-react';
import type { WorkspaceUnit } from '../data/businessWorkspace';
import { channelPlatforms } from './channelRepository';
import type { SocialAccount } from './commandRepository';
import { safeOutputUrl } from './repository';

const icons = {
  instagram: Instagram, tiktok: Music2, youtube: Youtube, facebook: Facebook,
  whatsapp: MessageCircle, marketplace: ShoppingBag, website: Globe2, other: Link2,
};

export function PlatformIcon({ platform }: { platform: SocialAccount['platform'] }) {
  const Icon = icons[platform] ?? Link2;
  return <span className="creative-platform-icon" data-platform={platform} aria-hidden="true"><Icon size={19} /></span>;
}

export function AccountIdentity({ account, unit }: { account: SocialAccount; unit?: WorkspaceUnit }) {
  const [failedUrl, setFailedUrl] = useState('');
  const logo = safeOutputUrl(unit?.logo_url ?? '');
  const initials = unit?.name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || '—';
  return <div className="flex min-w-0 items-start gap-3">
    <PlatformIcon platform={account.platform} />
    <div className="min-w-0 flex-1">
      <h3 className="break-words font-semibold">{account.handle}</h3>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span>{channelPlatforms[account.platform]}</span>
        <span className="creative-unit-chip">
          <span className="creative-unit-logo" aria-hidden="true">{logo.startsWith('https://') && logo !== failedUrl
            ? <img src={logo} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedUrl(logo)} /> : initials}</span>
          {unit?.name ?? 'Unit bisnis'}
        </span>
        {!account.is_active && <span className="rounded-full bg-slate-100 px-2 py-1 font-medium">Nonaktif</span>}
      </div>
    </div>
  </div>;
}

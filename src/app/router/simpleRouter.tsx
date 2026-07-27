/* eslint-disable react-refresh/only-export-components */
import { AnchorHTMLAttributes, createContext, MouseEvent, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

interface LocationState { pathname: string; search: string }
type NavigateTarget = string | number;
type NavigateFunction = (target: NavigateTarget, options?: { replace?: boolean }) => void;
interface RouterState extends LocationState { navigate: NavigateFunction }

const RouterContext = createContext<RouterState | null>(null);
function readLocation(): LocationState { return { pathname: window.location.pathname, search: window.location.search }; }

export function RouterProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState(readLocation);
  useEffect(() => { const sync = () => setLocation(readLocation()); window.addEventListener('popstate', sync); return () => window.removeEventListener('popstate', sync); }, []);
  const navigate: NavigateFunction = (target, options) => {
    if (typeof target === 'number') { window.history.go(target); return; }
    if (/^https?:\/\//.test(target)) { window.location.assign(target); return; }
    window.history[options?.replace ? 'replaceState' : 'pushState']({}, '', target);
    setLocation(readLocation());
    window.scrollTo({ top: 0, behavior: 'auto' });
  };
  const value = useMemo(() => ({ ...location, navigate }), [location]);
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

function useRouter() { const value = useContext(RouterContext); if (!value) throw new Error('RouterProvider tidak tersedia.'); return value; }
export function useNavigate() { return useRouter().navigate; }
export function useLocation() { const { pathname, search } = useRouter(); return { pathname, search }; }
export function useParams() { const { pathname } = useRouter(); const match = pathname.match(/^\/app\/projects\/([^/]+)\/?$/); return { projectId: match?.[1] ? decodeURIComponent(match[1]) : undefined }; }

interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> { to: string }
export function Link({ to, onClick, children, ...props }: LinkProps) {
  const navigate = useNavigate();
  function follow(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(to);
  }
  return <a href={to} onClick={follow} {...props}>{children}</a>;
}

interface NavLinkProps extends Omit<LinkProps, 'className'> { className?: string | ((state: { isActive: boolean }) => string) }
export function NavLink({ className, ...props }: NavLinkProps) {
  const { pathname } = useLocation();
  const active = pathname === props.to || (props.to !== '/app/today' && pathname.startsWith(`${props.to}/`));
  return <Link {...props} className={typeof className === 'function' ? className({ isActive: active }) : className} />;
}

export function Navigate({ to, replace = false }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  useEffect(() => navigate(to, { replace }), [navigate, replace, to]);
  return null;
}

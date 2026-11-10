"use client";

import { createContext, useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

type PageMotion = "forward" | "back" | "home" | "fade";
type NavigationOptions = { replace?: boolean; scroll?: boolean };
type PendingTransition = {
  from: string;
  motion: PageMotion;
  finish: () => void;
  navigate: () => void;
  view?: ViewTransition;
  animations?: Animation[];
};

export const RouteMotionContext = createContext<((href: string, options: NavigationOptions) => boolean) | null>(null);
const normalizedPath = (path: string) => path.replace(/\/+$/, "") || "/";
const exitEase = "cubic-bezier(0.32, 0.72, 0, 1)";
const enterEase = "cubic-bezier(0.32, 0.72, 0, 1)";

export function motionBetween(from: string, to: string): PageMotion {
  const source = normalizedPath(from);
  const target = normalizedPath(to);
  if (target === "/") return "home";
  const categories = ["streaming", "ai", "vpn", "mobile-data", "music", "creative-work", "social"];
  if (source.startsWith("/category/") && target.startsWith("/category/")) {
    const before = categories.indexOf(source.split("/")[2]);
    const after = categories.indexOf(target.split("/")[2]);
    if (before >= 0 && after >= 0) return after < before ? "back" : "forward";
  }
  if (target === "/products") return source === "/" ? "forward" : "back";
  if (source.startsWith("/product/") && target.startsWith("/category/")) return "back";
  return target.startsWith("/category/") || target.startsWith("/product/") ? "forward" : "fade";
}

function motionFrames(motion: PageMotion, entering: boolean): Keyframe[] {
  const rest = { opacity: 1, transform: "none", transformOrigin: "50% 0%" };
  const transform = motion === "forward" ? `translateX(${entering ? 28 : -12}px)`
    : motion === "back" ? `translateX(${entering ? -28 : 12}px)`
    : motion === "home" ? `scale(${entering ? 0.985 : 1.01})`
    : `translateY(${entering ? 8 : -4}px)`;
  const away = { opacity: entering ? 0.75 : 0.8, transform, transformOrigin: "50% 0%" };
  return entering ? [away, rest] : [rest, away];
}

function visibleContent(root: HTMLDivElement | null) {
  return Array.from(root?.children ?? []).filter((element): element is HTMLElement => {
    if (!(element instanceof HTMLElement) || !element.matches("main, section, .reveal")) return false;
    const bounds = element.getBoundingClientRect();
    return bounds.bottom > 0 && bounds.top < window.innerHeight && typeof element.animate === "function";
  });
}

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const previousPath = useRef(pathname);
  const rootRef = useRef<HTMLDivElement>(null);
  const pending = useRef<PendingTransition | null>(null);
  const trail = useRef({ paths: [pathname], index: 0 });
  const historyMotion = useRef<PageMotion | null>(null);

  const navigate = useCallback((href: string, options: NavigationOptions) => {
    const destination = new URL(href, window.location.href);
    if (destination.origin !== window.location.origin || normalizedPath(destination.pathname) === normalizedPath(pathname) ||
        document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    const native = typeof document.startViewTransition === "function";
    const targets = native ? [] : visibleContent(rootRef.current);
    if (!native && !targets.length) return false;

    pending.current?.finish();
    pending.current?.view?.skipTransition();
    pending.current?.animations?.forEach((animation) => animation.cancel());
    let resolveCommit: () => void;
    let navigated = false;
    const committed = new Promise<void>((resolve) => { resolveCommit = resolve; });
    const entry: PendingTransition = {
      from: pathname,
      motion: motionBetween(pathname, destination.pathname),
      finish: () => { window.clearTimeout(timeout); resolveCommit(); },
      navigate: () => {
        if (pending.current !== entry || navigated) return;
        navigated = true;
        const target = `${destination.pathname}${destination.search}${destination.hash}`;
        if (options.replace) router.replace(target, { scroll: options.scroll });
        else router.push(target, { scroll: options.scroll });
      },
    };
    // A slow or failed route must never leave the browser holding a snapshot.
    const timeout = window.setTimeout(() => {
      entry.navigate();
      entry.finish();
      entry.view?.skipTransition();
      entry.animations?.forEach((animation) => animation.cancel());
      if (pending.current === entry && !entry.view) pending.current = null;
    }, 1500);
    pending.current = entry;
    if (native) document.documentElement.dataset.routeMotion = entry.motion;
    try {
      if (!native) {
        // Fetch while the outgoing page animates, then preserve the normal URL.
        router.prefetch(`${destination.pathname}${destination.search}`);
        entry.animations = targets.map((element) => element.animate(
          motionFrames(entry.motion, false),
          { duration: 180, easing: exitEase, fill: "forwards" },
        ));
        void Promise.all(entry.animations.map((animation) => animation.finished)).then(entry.navigate).catch(() => {});
        return true;
      }
      entry.view = document.startViewTransition(() => {
        if (pending.current !== entry) return;
        entry.navigate();
        return committed;
      });
      void entry.view.ready.catch(() => {});
      void entry.view.finished.catch(() => {}).finally(() => {
        entry.finish();
        if (pending.current === entry) {
          pending.current = null;
          delete document.documentElement.dataset.routeMotion;
        }
      });
      return true;
    } catch {
      entry.animations?.forEach((animation) => animation.cancel());
      entry.finish();
      pending.current = null;
      delete document.documentElement.dataset.routeMotion;
      return false;
    }
  }, [pathname, router]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cancel = () => {
      if (!pending.current?.view) pending.current?.navigate();
      pending.current?.finish();
      pending.current?.view?.skipTransition();
      pending.current?.animations?.forEach((animation) => animation.cancel());
    };
    const onMotionChange = () => { if (reducedMotion.matches) cancel(); };
    const onVisibilityChange = () => { if (document.hidden) cancel(); };
    const onHistoryChange = () => {
      const destination = new URL(window.location.href).pathname;
      if (normalizedPath(destination) !== normalizedPath(previousPath.current)) {
        const { paths, index } = trail.current;
        const earlier = index > 0 ? paths.lastIndexOf(destination, index - 1) : -1;
        const later = paths.indexOf(destination, index + 1);
        historyMotion.current = earlier >= 0 || later < 0 ? "back" : "forward";
        if (earlier >= 0) trail.current.index = earlier;
        else if (later >= 0) trail.current.index = later;
      }
      const entry = pending.current;
      pending.current = null;
      entry?.finish();
      entry?.view?.skipTransition();
      entry?.animations?.forEach((animation) => animation.cancel());
      delete document.documentElement.dataset.routeMotion;
    };
    reducedMotion.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("popstate", onHistoryChange);
    return () => {
      pending.current?.finish();
      pending.current?.view?.skipTransition();
      pending.current?.animations?.forEach((animation) => animation.cancel());
      pending.current = null;
      delete document.documentElement.dataset.routeMotion;
      reducedMotion.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("popstate", onHistoryChange);
    };
  }, []);

  useLayoutEffect(() => {
    const from = previousPath.current;
    const changed = from !== pathname;
    previousPath.current = pathname;
    if (!changed) return;
    const motion = historyMotion.current ?? pending.current?.motion ?? motionBetween(from, pathname);
    if (!historyMotion.current) {
      trail.current.paths = [...trail.current.paths.slice(0, trail.current.index + 1), pathname];
      trail.current.index++;
    }
    historyMotion.current = null;
    if (pending.current && pending.current.from !== pathname) {
      pending.current.finish();
      if (pending.current.view) return;
      pending.current.animations?.forEach((animation) => animation.cancel());
      pending.current = null;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Back/Forward and older browsers use the same entry without hiding SSR.
    if (reducedMotion.matches || document.hidden || !rootRef.current) return;

    const animations = visibleContent(rootRef.current).map((element) => element.animate(
      motionFrames(motion, true),
      { duration: 440, easing: enterEase },
    ));
    const cancel = () => animations.forEach((animation) => animation.cancel());
    const onMotionChange = () => { if (reducedMotion.matches) cancel(); };
    reducedMotion.addEventListener("change", onMotionChange);
    return () => {
      cancel();
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, [pathname]);

  return (
    <RouteMotionContext.Provider value={navigate}>
      <div className="page-transition" ref={rootRef}>{children}</div>
    </RouteMotionContext.Provider>
  );
}

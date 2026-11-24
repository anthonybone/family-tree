"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

const SAVED: Record<string, string> = {
  created: "Person added. You can now link relationships below.",
  updated: "Changes saved.",
  deleted: "Person deleted.",
};

/** Self-dismissing confirmation message. Mount it with a new `key` to show it again. */
function ToastView({ text }: { text: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-900 shadow-lg"
    >
      ✓ {text}
    </div>
  );
}

/** For in-page actions: render `node` once, call `show(text)` after each success. */
export function useToast(): readonly [ReactNode, (text: string) => void] {
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const show = useCallback((text: string) => setToast({ text, id: Date.now() }), []);
  return [toast ? <ToastView key={toast.id} text={toast.text} /> : null, show] as const;
}

/** For actions that redirect: the server adds `?saved=<code>`, which is shown once and then removed from the URL. */
export function SavedToast({ code }: { code?: string }) {
  const text = code ? SAVED[code] : undefined;
  useEffect(() => {
    if (text) window.history.replaceState(null, "", window.location.pathname + window.location.hash);
  }, [text]);
  return text ? <ToastView text={text} /> : null;
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await fetch("/api/auth/me");
        if (!mounted) return;
        if (res.ok) {
          setAuthed(true);
        } else {
          setAuthed(false);
          router.replace("/login");
        }
      } catch (_e) {
        if (mounted) router.replace("/login");
      } finally {
        if (mounted) setReady(true);
      }
    }
    check();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) return null;
  if (!authed) return null;

  return <>{children}</>;
}

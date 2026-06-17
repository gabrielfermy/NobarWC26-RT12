"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const TIMEOUT_IN_MS = 15 * 60 * 1000; // 15 Minutes
const STORAGE_KEY = "nobar_last_activity";

export function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const checkInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let hasSession = false;

    // Check if session exists initially
    supabase.auth.getSession().then(({ data: { session } }) => {
      hasSession = !!session;
    });

    // Listen to authentication state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      hasSession = !!session;
      if (session) {
        updateActivity();
      } else {
        if (typeof window !== "undefined") {
          window.sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    });

    const updateActivity = () => {
      if (hasSession && typeof window !== "undefined") {
        window.sessionStorage.setItem(STORAGE_KEY, Date.now().toString());
      }
    };

    const checkIdleTime = async () => {
      if (!hasSession) return;

      const lastActivity = window.sessionStorage.getItem(STORAGE_KEY);
      if (!lastActivity) {
        updateActivity();
        return;
      }

      const timeElapsed = Date.now() - parseInt(lastActivity, 10);
      if (timeElapsed >= TIMEOUT_IN_MS) {
        window.sessionStorage.removeItem(STORAGE_KEY);
        hasSession = false;
        await supabase.auth.signOut();
        router.push("/login?message=session_expired");
      }
    };

    // Activity event listeners
    const activityEvents = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    const handleEvent = () => updateActivity();

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleEvent);
    });

    // Check idle status every 10 seconds
    checkInterval.current = setInterval(checkIdleTime, 10000);

    return () => {
      // Cleanup
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleEvent);
      });
      if (checkInterval.current) clearInterval(checkInterval.current);
      subscription.unsubscribe();
    };
  }, [router]);

  return <>{children}</>;
}

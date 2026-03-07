'use client'
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Main() {
  const [session, setSession] = useState<any>(undefined);
  const router = useRouter();

  useEffect(() => {
    const getInitialSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null); // null if logged out
    };

    getInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Redirect after session is loaded
  useEffect(() => {
    if (session === undefined) return; // still loading

    if (!session) {
      router.push("/login"); // redirect if not logged in
    } else {
      // Optional: redirect to home or channels if logged in
      router.push("/channels/@me");
    }
  }, [session, router]);

  return <p>Checking authentication...</p>;
}
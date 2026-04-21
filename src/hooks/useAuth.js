import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function useAuth() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription = null;

    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!error) {
        setSession(data.session ?? null);
      }

      setLoading(false);
    };

    getSession();

    const { data } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession ?? null);
    });

    subscription = data.subscription;

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return { session, loading };
}
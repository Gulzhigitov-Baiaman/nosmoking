import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPremium: boolean;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isPremium: false,
  checkSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // 🧪 TESTING MODE: Premium enabled for all users
  const [isPremium, setIsPremium] = useState(true);

  const checkSubscription = async () => {
    // 🧪 TESTING MODE: Always set premium to true
    // TODO: Revert this after testing is complete
    setIsPremium(true);
    
    /* Original code - uncomment after testing:
    if (!user) {
      setIsPremium(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setIsPremium(data?.subscribed || false);
    } catch (error) {
      console.error("Error checking subscription:", error);
      setIsPremium(false);
    }
    */
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (session?.user) {
          await checkSubscription();
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        await checkSubscription();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, isPremium, checkSubscription }}>
      {children}
    </AuthContext.Provider>
  );
};

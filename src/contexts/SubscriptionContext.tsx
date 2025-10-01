import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

interface SubscriptionContextType {
  isPremium: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  createCheckout: () => Promise<void>;
  manageSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  subscriptionEnd: null,
  loading: true,
  checkSubscription: async () => {},
  createCheckout: async () => {},
  manageSubscription: async () => {},
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabaseClient();
  const user = useUser();

  const checkSubscription = async () => {
    if (!user) {
      setIsPremium(false);
      setSubscriptionEnd(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) {
        console.error("Error checking subscription:", error);
        setIsPremium(false);
        setSubscriptionEnd(null);
      } else {
        setIsPremium(data?.subscribed || false);
        setSubscriptionEnd(data?.subscription_end || null);
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
      setIsPremium(false);
      setSubscriptionEnd(null);
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      throw error;
    }
  };

  const manageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      throw error;
    }
  };

  useEffect(() => {
    checkSubscription();
    
    // Check subscription status every minute
    const interval = setInterval(checkSubscription, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        subscriptionEnd,
        loading,
        checkSubscription,
        createCheckout,
        manageSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

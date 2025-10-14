import { useSubscription } from "./useSubscription";

export const usePremium = () => {
  const { subscribed, loading } = useSubscription();
  
  return {
    isPremium: subscribed, // ✅ Real Stripe subscription check
    isLoading: loading,
  };
};

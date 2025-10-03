import { useSubscription } from "./useSubscription";

export const usePremium = () => {
  const { subscribed, loading } = useSubscription();
  
  return {
    isPremium: subscribed,
    isLoading: loading,
  };
};

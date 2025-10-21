import { useSubscription } from "./useSubscription";

export const usePremium = () => {
  const { subscribed, loading } = useSubscription();

  // Grant premium access based on server-validated Stripe subscription only
  return {
    isPremium: subscribed,
    isLoading: loading,
  };
};

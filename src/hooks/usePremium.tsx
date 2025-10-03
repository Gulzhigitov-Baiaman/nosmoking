import { useSubscription } from "./useSubscription";

export const usePremium = () => {
  const { subscribed, loading } = useSubscription();
  
  // 🧪 TESTING MODE: Premium features enabled for all users
  // TODO: Revert this after testing is complete
  return {
    isPremium: true, // Temporarily always true for testing
    isLoading: false,
  };
};

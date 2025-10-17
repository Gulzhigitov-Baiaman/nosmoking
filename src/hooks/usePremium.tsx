import { useState, useEffect } from "react";
import { useSubscription } from "./useSubscription";

const SECRET_CODE = "letsquitnow";
const SECRET_CODE_KEY = "premium_secret_activated";

export const usePremium = () => {
  const { subscribed, loading } = useSubscription();
  const [secretActivated, setSecretActivated] = useState(false);

  useEffect(() => {
    // Check if secret code is activated in localStorage
    const activated = localStorage.getItem(SECRET_CODE_KEY) === "true";
    setSecretActivated(activated);
  }, []);

  // Grant premium access based on Stripe subscription OR secret code
  return {
    isPremium: subscribed || secretActivated,
    isLoading: loading,
  };
};

export const activateSecretCode = (code: string): boolean => {
  if (code === SECRET_CODE) {
    localStorage.setItem(SECRET_CODE_KEY, "true");
    return true;
  }
  return false;
};

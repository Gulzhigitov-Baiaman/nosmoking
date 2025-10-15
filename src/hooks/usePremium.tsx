import { useSubscription } from "./useSubscription";
import { useState, useEffect } from "react";

const SECRET_CODE = "letsquitnow";
const SECRET_CODE_KEY = "premium_secret_code";

export const usePremium = () => {
  const { subscribed, loading } = useSubscription();
  const [hasSecretCode, setHasSecretCode] = useState(false);

  useEffect(() => {
    // Check for secret code in localStorage
    const storedCode = localStorage.getItem(SECRET_CODE_KEY);
    setHasSecretCode(storedCode === SECRET_CODE);
  }, []);

  // Grant premium access if EITHER Stripe subscription OR secret code is valid
  return {
    isPremium: subscribed || hasSecretCode,
    isLoading: loading,
  };
};

export const validateSecretCode = (code: string): boolean => {
  if (code.trim().toLowerCase() === SECRET_CODE) {
    localStorage.setItem(SECRET_CODE_KEY, code.trim().toLowerCase());
    return true;
  }
  return false;
};

export const clearSecretCode = () => {
  localStorage.removeItem(SECRET_CODE_KEY);
};

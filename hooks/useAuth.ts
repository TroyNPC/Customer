import { useEffect, useState } from "react";

let isLoggedIn = false;
let isGuest = false;
const listeners = new Set<(value: boolean, guest?: boolean) => void>();

export const useAuth = () => {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn);
  const [guest, setGuest] = useState(isGuest);

  const updateLogin = (value: boolean, guestMode = false) => {
    isLoggedIn = value;
    isGuest = guestMode;
    listeners.forEach((fn) => fn(value, guestMode));
  };

  const logout = () => {
    isLoggedIn = false;
    isGuest = false;
    listeners.forEach((fn) => fn(false, false));
  };

  useEffect(() => {
    // Subscribe to login state changes
    const listener = (value: boolean, guestMode?: boolean) => {
      setLoggedIn(value);
      setGuest(!!guestMode);
    };
    listeners.add(listener);

    // Cleanup on unmount
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { loggedIn, guest, setLoggedIn: updateLogin, logout };
};

import { createContext, useContext, useRef, useState, useEffect } from "react";
import { BASE_URL } from "../lib/utils";

const UserContext = createContext();

const NOTIF_TTL = 30_000; // 30 seconds

const UserContextProvider = ({ children }) => {
  const [fullName, setFullName] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [numberOfNotifications, setNumberOfNotifications] = useState(0);
  const [notifications, setNotifications] = useState(null); // null = never fetched
  const notifsFetchedAt = useRef(0);

  useEffect(() => {
    const checkLogin = async () => {
      const response = await fetch(`${BASE_URL}/auth/me`, {
        credentials: "include",
        method: "GET",
      });
      const data = await response.json();
      if (data.isGuest) {
        setIsGuest(true);
      } else {
        setFullName(data.name);
        setIsLoggedIn(true);
      }
      setAuthChecked(true);
    };
    checkLogin();
  }, []);

  const fetchNotifications = async (force = false) => {
    if (!force && Date.now() - notifsFetchedAt.current < NOTIF_TTL) return;
    try {
      const r = await fetch(`${BASE_URL}/notifications`, { credentials: "include" });
      if (!r.ok) return;
      const data = await r.json();
      setNotifications(data);
      notifsFetchedAt.current = Date.now();
    } catch {}
  };

  const invalidateNotifications = () => {
    notifsFetchedAt.current = 0;
  };

  return (
    <UserContext.Provider
      value={{
        fullName,
        setFullName,
        selectedId,
        setSelectedId,
        isLoggedIn,
        setIsLoggedIn,
        authChecked,
        numberOfNotifications,
        setNumberOfNotifications,
        isGuest,
        setIsGuest,
        notifications,
        fetchNotifications,
        invalidateNotifications,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const UserInfo = () => {
  return useContext(UserContext);
};

export default UserContextProvider;

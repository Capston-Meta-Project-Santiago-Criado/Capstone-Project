import InboxList from "./components/InboxList";
import { BASE_URL } from "./lib/utils";
import { useEffect } from "react";
import { UserInfo } from "./context/UserContext";

const Inbox = () => {
  const { setNumberOfNotifications, fetchNotifications } = UserInfo();

  useEffect(() => {
    // Clear badge count immediately on open
    setNumberOfNotifications(0);
    fetch(`${BASE_URL}/notifications/reset`, {
      method: "POST",
      credentials: "include",
    });
    // Load notifications (uses cache if fresh, fetches if stale)
    fetchNotifications();
  }, []);

  return (
    <main className="w-full min-h-screen px-6 py-8">
      <InboxList />
    </main>
  );
};

export default Inbox;

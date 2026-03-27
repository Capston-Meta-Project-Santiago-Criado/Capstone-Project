import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { BASE_URL } from "../lib/utils";

const InboxList = () => {
  const [allUserNotifications, setAllUserNotifications] = useState([]);

  useEffect(() => {
    const getNotifications = async () => {
      const response = await fetch(`${BASE_URL}/notifications`, {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) return;
      setAllUserNotifications(await response.json());
    };
    getNotifications();
  }, []);

  const navigate = useNavigate();

  const goToPortfolio = (url) => {
    navigate("/" + url);
  };

  return (
    <div className="flex flex-col flex-wrap mx-30 mt-25 justify-center">
      <h1 className="text-white ml-10"> Inbox</h1>
      {allUserNotifications != null &&
        allUserNotifications.map((value) => {
          const dateObj = new Date(value.created_at);
          const date = dateObj.toISOString().split("T")[0];
          const hour = dateObj.getHours();
          const minute = dateObj.getMinutes().toString().padStart(2, "0");
          return (
            <div
              key={value.id}
              className="bg-indigo-50 rounded-sm hover:scale-105  hover:cursor-pointer transition-transform duration-150 ease-in-out w-300 m-2"
              onClick={() => {
                goToPortfolio(value.url);
              }}
            >
              <div className="flex flex-row justify-between">
                <h2 className="text-black text-center m-2">
                  {value.description}
                </h2>
                <h2 className="text-black text-center m-2 font-bold">
                  {date}, {hour}:{minute}
                </h2>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default InboxList;

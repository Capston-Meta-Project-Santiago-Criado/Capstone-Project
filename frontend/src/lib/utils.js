import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { UserInfo } from "../context/UserContext";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BASE_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://capstone-project-db-service.onrender.com"; // official database url
const LOGIN_SUCCESS = "password accepted";

const handleLogin = async (
  formData,
  responseSetter,
  setIsLoggedIn,
  setFullName
) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    if (response.ok === true) {
      const data = await response.json();
      responseSetter(LOGIN_SUCCESS);
      setIsLoggedIn(true);
      setFullName(data.name);
      return true;
    } else {
      const s = await response.json();
      responseSetter(s.error);
    }
  } catch {
    return;
  }
};

// Daily % change vs. previous close — same formula as the backend's dailyChangePct
const toPercentage = (currentPrice, previousClose) => {
  if (!previousClose) return "0.00";
  return (((currentPrice - previousClose) / previousClose) * 100).toFixed(2);
};

const wait = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export { handleLogin, BASE_URL, toPercentage, wait };

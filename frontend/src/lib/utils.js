import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const BASE_URL = import.meta.env.DEV ? "http://localhost:3000" : ""; // official database url
const LOGIN_SUCCESS = "password accepted";

const handleLogin = async (formData, responseSetter, attemptLogin) => {
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
      responseSetter(LOGIN_SUCCESS);
      attemptLogin();
    } else {
      const s = await response.json();
      responseSetter(s.error);
    }
  } catch {
    return;
  }
};

export { handleLogin, BASE_URL };

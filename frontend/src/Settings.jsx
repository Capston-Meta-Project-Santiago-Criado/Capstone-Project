import { BASE_URL } from "./lib/utils";
import { useNavigate } from "react-router-dom";
import { UserInfo } from "./context/UserContext";
import SignUpPreferences from "./components/signup/SignUpPreferences";

const Settings = () => {
  const { setIsLoggedIn, setAuthChecked, isGuest, setFullName } = UserInfo();

  const navigate = useNavigate();

  if (isGuest) {
    return (
      <div className=" flex flex-col items-center w-full">
        <h2 className="text-white mt-40 ml-auto mr-auto mb-5">
          Log in to create and use portfolio tools, personalized
          recommendations, excel checkout, and more!
        </h2>
        <button
          className="m-3 bg-yellow-500 ml-auto mr-auto  h-12 hover:scale-110 hover:brightness-80"
          onClick={() => {
            navigate("/login");
          }}
        >
          Log in
        </button>
      </div>
    );
  }

  const signOut = async () => {
    await fetch(`${BASE_URL}/auth/signout`, {
      method: "DELETE",
      credentials: "include",
    });
    setIsLoggedIn(false);
    setFullName("");
    setAuthChecked(false);
    navigate("/login");
  };
  return (
    <main className="w-full">
      <div className="flex flex-col items-center">
        <h3 className="self-center text-center text-6xl mt-30 mb-10 text-indigo-50 font-semibold -z-10">
          Settings
        </h3>
        <button
          className="bg-white hover:cursor-pointer hover:scale-140 hover:brightness-110 mt-2"
          onClick={signOut}
        >
          Log Out
        </button>
        <SignUpPreferences changeMode={true} />
      </div>
    </main>
  );
};

export default Settings;

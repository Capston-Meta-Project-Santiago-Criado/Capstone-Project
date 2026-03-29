import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { handleLogin } from "./lib/utils";
import InputBox from "./components/InputBox";
import { UserInfo } from "./context/UserContext";

const LOGIN_SUCCESS = "password accepted";

const Login = () => {
  const [formData, setFormData] = useState({
    password: "",
    username: "",
  });
  const [isInSubmission, setIsInSubmission] = useState(false);
  const [isGuestInSubmission, setIsGuestInSubmission] = useState(false);
  const { setIsLoggedIn, setFullName, setIsGuest } = UserInfo();
  const [submitResult, setSubmitResult] = useState(null);
  const navigate = useNavigate();

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const submitGuestLogin = async (e) => {
    e.preventDefault();
    setIsGuestInSubmission(true);
    setIsGuest(true);
    navigate("/");
    setIsGuestInSubmission(false);
  };

  const submitLoginAttempt = async (e) => {
    e.preventDefault();
    setIsInSubmission(true);
    if (formData.password == "" || formData.username == "") {
      setSubmitResult("Please fill out all forms");
      setIsInSubmission(false);
      return;
    }
    const loginSuccesful = await handleLogin(
      formData,
      setSubmitResult,
      setIsLoggedIn,
      setFullName
    );
    if (loginSuccesful === true) {
      navigate("/");
    }
    setIsInSubmission(false);
    setIsGuest(false);
  };

  return (
    <div className="flex flex-col">
      <header>
        <div className="text-center m-15 text-2xl font-bold text-indigo-50 text-shadow-xl ">
          <h1 className="drop-shadow-[0px_0px_39px_rgba(247,247,247,.7)]">
            Alpha-Edge
          </h1>
        </div>
      </header>
      <form method="post" className="flex flex-col bg-indigo-50 p-8 rounded-md shadow-xl/40 shadow-slate-900 w-150 m-auto">
        <h3 className="font-bold text-3xl p-3 text-center"> Welcome Back</h3>
        <InputBox
          placeholder="Username"
          label="Username"
          name="username"
          value={formData.username}
          handleFormChange={handleFormChange}
        />
        <InputBox
          placeholder={"Password"}
          label={"Password"}
          name={"password"}
          value={formData.password}
          handleFormChange={handleFormChange}
          isPassword={true}
        />
        {!isInSubmission && (
          <button
            id="login"
            className="m-2 bg-fuchsia-950 text-white shadow-xl/10 shadow-slate-900  hover:brightness-110"
            onClick={submitLoginAttempt}
          >
            Login
          </button>
        )}
        {
          <button
            id="guest"
            className="m-2 bg-pink-400 text-white shadow-xl/10
            shadow-slate-900 hover:brightness-110"
            onClick={submitGuestLogin}
          >
            Continue as Guest
          </button>
        }
        {isInSubmission ||
          (isGuestInSubmission && (
            <div className="mr-auto ml-auto rounded-full w-8 h-8 m-3 border-10 border-t-transparent border-purple-500 animate-spin"></div>
          ))}
        {submitResult != null && (
          <p
            className={`text-center font-bold ${
              submitResult === LOGIN_SUCCESS
                ? "text-green-600"
                : "text-pink-600"
            } `}
          >
            {submitResult}
          </p>
        )}
        <button
          id="signup"
          className="m-2 bg-green-400 shadow-xl/10 shadow-slate-900 text-black  hover:brightness-110"
          onClick={() => navigate("/signup")}
        >
          Sign-Up
        </button>
      </form>
    </div>
  );
};

export default Login;

import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { handleLogin, BASE_URL } from "./lib/utils";
import InputBox from "./components/InputBox";

const LOGIN_SUCCESS = "password accepted";

const Login = ({ attemptLogin }) => {
  const [formData, setFormData] = useState({
    password: "",
    username: "",
  });

  const [submitResult, setSubmitResult] = useState(null);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const submitLoginAttempt = async (e) => {
    e.preventDefault();
    if (formData.password == "" || formData.username == "") {
      setSubmitResult("Please fill out all forms");
      return;
    }
    await handleLogin(formData, setSubmitResult, attemptLogin);
  };

  const navigate = useNavigate();
  return (
    <div className="flex flex-col">
      <header>
        <div className="text-center m-15 text-2xl font-bold text-indigo-50 text-shadow-xl ">
          <h1 className="drop-shadow-[0px_0px_39px_rgba(247,247,247,.7)]">
            Alpha-Edge
          </h1>
        </div>
      </header>
      <form className="flex flex-col bg-indigo-50 p-8 rounded-md shadow-xl/40 shadow-slate-900 w-150 m-auto">
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
        <button
          id="login"
          className="m-2 bg-fuchsia-950 text-white shadow-xl/10 shadow-slate-900  hover:brightness-110"
          onClick={submitLoginAttempt}
        >
          Login
        </button>
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

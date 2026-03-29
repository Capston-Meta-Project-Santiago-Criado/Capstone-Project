import InputBox from "./components/InputBox";
import { useNavigate } from "react-router-dom";
import { BASE_URL, wait } from "./lib/utils";
import { MIN_PASSWORD_LENGTH } from "./lib/constants";
import { useState } from "react";
import { handleLogin } from "./lib/utils";
import { SignUpInfoContext } from "./context/SignUpContext";
import { UserInfo } from "./context/UserContext";
import SignUpPreferences from "./components/signup/SignUpPreferences";
import * as EmailValidator from "email-validator";

const RESULT_SUCCESS = "Thank you for signing up, redirecting to login...";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    username: "",
    email: "",
  });
  const { setIsLoggedIn, setFullName, setIsGuest } = UserInfo();
  const { sectorsSelected, industriesSelected } = SignUpInfoContext();
  const [signUpPressed, setSignUpPressed] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleNext = async () => {
    if (
      formData.name == "" ||
      formData.password == "" ||
      formData.username == "" ||
      formData.email == ""
    ) {
      alert("Please do not leave any sections empty");
      return;
    }

    const response = await fetch(`${BASE_URL}/auth/check-signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        password: formData.password,
        username: formData.username,
        email: formData.email,
      }),
    });
    const { isUserExisting } = await response.json();
    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      alert("Please make sure passwords are longer than 8 characters");
      return;
    }
    if (!EmailValidator.validate(formData.email)) {
      alert("Please use a real email address / correct email format");
      return;
    }
    if (isUserExisting) {
      setSubmitResult("username or email already in use");
      return;
    } else {
      setSignUpPressed(true);
    }
  };

  const createUser = async (event) => {
    event.preventDefault();

    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.name,
        password: formData.password,
        username: formData.username,
        email: formData.email,
        interestedIndustries: industriesSelected,
        sectors: sectorsSelected,
      }),
    });
    if (response.ok) {
      setSubmitResult(RESULT_SUCCESS);
      await wait(500);
      await handleLogin(formData, setSubmitResult, setIsLoggedIn, setFullName);
      setIsGuest(false);
      navigate("/");
    } else {
      const s = await response.json();
      setSubmitResult(s.error);
    }
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
      {!signUpPressed && (
        <form method="post" className="flex flex-col bg-indigo-50 p-8 rounded-md shadow-xl/40 w-150 m-auto">
          <h3 className="font-bold text-3xl p-1 text-center">Sign Up</h3>
          <p className="font-bold text-sm p-0 text-center">
            Please sign up to continue{" "}
          </p>
          <InputBox
            placeholder="John Doe"
            label="Full Name"
            name="name"
            value={formData.name}
            handleFormChange={handleFormChange}
          />

          <InputBox
            placeholder="johndoe@gmail.com"
            label="Email"
            name="email"
            value={formData.email}
            handleFormChange={handleFormChange}
          />
          <InputBox
            placeholder="Username"
            label="Username"
            name="username"
            value={formData.username}
            handleFormChange={handleFormChange}
          />
          <InputBox
            placeholder="Password"
            label="Password"
            name="password"
            value={formData.password}
            handleFormChange={handleFormChange}
            isPassword={true}
            isNewPassword={true}
          />
          <button
            type="submit"
            id="signup"
            className="m-2 bg-green-400 shadow-xl/10 shadow-slate-900  hover:brightness-110"
            onClick={handleNext}
          >
            Next
          </button>
          {submitResult != null && (
            <p className="text-center font-bold text-red-600">{submitResult}</p>
          )}

          <button
            onClick={() => {
              navigate("/");
            }}
            id="login"
            className="m-2 bg-fuchsia-950 text-white shadow-xl/10 shadow-slate-900 hover:brightness-110"
          >
            Back to login
          </button>
        </form>
      )}
      {signUpPressed && (
        <SignUpPreferences createUser={createUser} changeMode={false} />
      )}
    </div>
  );
};

export default SignUp;

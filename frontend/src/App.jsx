import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./Login";
import SignUp from "./SignUp";
import Home from "./Home";
import { UserInfo } from "./context/UserContext";
import CompanyInfo from "./CompanyInfo";
import Portfolios from "./Portfolios";
import PortfolioInfo from "./PortfolioInfo";
import Footer from "./Footer";

const LoggedInPage = ({ isLoggedIn, children }) => {
  return isLoggedIn ? children : <Login />;
};

const App = () => {
  const { isLoggedIn, authChecked } = UserInfo();

  if (!authChecked) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <BrowserRouter>
        <Routes>
          <Route
            path="/CompanyInfo/:selectedId"
            element={
              <LoggedInPage isLoggedIn={isLoggedIn}>
                <CompanyInfo />
              </LoggedInPage>
            }
          />
          <Route
            path="/"
            element={
              <LoggedInPage isLoggedIn={isLoggedIn}>
                <Home />
              </LoggedInPage>
            }
          />
          <Route
            path="/login"
            element={
              <LoggedInPage isLoggedIn={isLoggedIn}>
                <Home />
              </LoggedInPage>
            }
          />
          <Route
            path="/home"
            element={
              <LoggedInPage isLoggedIn={isLoggedIn}>
                <Home />
              </LoggedInPage>
            }
          />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/portfolios"
            element={
              <LoggedInPage isLoggedIn={isLoggedIn}>
                <Portfolios />
              </LoggedInPage>
            }
          />
          <Route
            path="/portfolios/:id"
            element={
              <LoggedInPage isLoggedIn={isLoggedIn}>
                <PortfolioInfo />
              </LoggedInPage>
            }
          />
        </Routes>
      </BrowserRouter>
      <Footer />
    </div>
  );
};
export default App;

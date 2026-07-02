import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Login from "./Login";
import SignUp from "./SignUp";
import Home from "./Home";
import Inbox from "./Inbox";
import { UserInfo } from "./context/UserContext";
import CompanyInfo from "./CompanyInfo";
import Portfolios from "./Portfolios";
import PortfolioInfo from "./PortfolioInfo";
import Footer from "./Footer";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import SearchBar from "./components/SearchBar";
import { useNavigate } from "react-router-dom";
import Settings from "./Settings";
import CanalystConverter from "./CanalystConverter";
import AiChats from "./AiChats";
import { socket } from "./socket";
import { useEffect } from "react";

const LoggedInPage = ({ isLoggedIn, children, isGuest }) => {
  const { fullName, numberOfNotifications, setNumberOfNotifications, invalidateNotifications } =
    UserInfo();

  useEffect(() => {
    const onNotification = (number) => {
      setNumberOfNotifications(number);
      // Force-refresh the cached notification list so inbox updates immediately
      invalidateNotifications();
    };

    socket.on("notification", onNotification);
    return () => {
      socket.off("notification", onNotification);
    };
  }, []);
  const navigate = useNavigate();
  return isLoggedIn || isGuest ? (
    <SidebarProvider>
      <AppSidebar numberOfNotifications={numberOfNotifications} />
      <header className="fixed top-0 w-full h-14 z-50 flex items-center justify-between px-4 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/8">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="text-gray-400 hover:text-white hover:bg-white/6 rounded-md" />
          <h2
            className="text-xl font-bold tracking-tight text-white hover:cursor-pointer hover:text-emerald-400 transition-colors duration-200"
            onClick={() => navigate("/home")}
          >
            Alpha<span className="text-emerald-400">Edge</span>
          </h2>
        </div>
        <SearchBar />
        <div className="flex items-center gap-3">
          {isGuest && !isLoggedIn && (
            <button
              onClick={() => navigate("/login")}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all duration-200 whitespace-nowrap"
            >
              Sign In
            </button>
          )}
          <p className="text-sm text-gray-400 whitespace-nowrap">
            Good day,{" "}
            <span
              className="font-semibold text-white hover:text-emerald-400 hover:cursor-pointer transition-colors duration-200"
              onClick={() => navigate("/settings")}
            >
              {fullName || "Guest"}
            </span>
          </p>
        </div>
      </header>
      <div className="flex-1 pt-14 min-w-0">{children}</div>
    </SidebarProvider>
  ) : (
    <Login />
  );
};

const App = () => {
  const { isLoggedIn, authChecked, isGuest } = UserInfo();

  if (!authChecked) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <BrowserRouter>
        <Routes>
          {[
            ["/", <Home />],
            ["/home", <Home />],
            ["/CompanyInfo/:selectedId", <CompanyInfo />],
            ["/inbox", <Inbox />],
            ["/settings", <Settings />],
            ["/canalyst", <CanalystConverter />],
            ["/ai-chats", <AiChats />],
            ["/portfolios", <Portfolios />],
            ["/portfolios/:id", <PortfolioInfo />],
          ].map(([path, page]) => (
            <Route
              key={path}
              path={path}
              element={
                <LoggedInPage isLoggedIn={isLoggedIn} isGuest={isGuest}>
                  {page}
                </LoggedInPage>
              }
            />
          ))}
          <Route
            path="/login"
            element={
              <LoggedInPage isLoggedIn={isLoggedIn}>
                <Home />
              </LoggedInPage>
            }
          />
          <Route path="/signup" element={isLoggedIn ? <Navigate to="/home" replace /> : <SignUp />} />
        </Routes>
      </BrowserRouter>
      <Footer />
    </div>
  );
};
export default App;

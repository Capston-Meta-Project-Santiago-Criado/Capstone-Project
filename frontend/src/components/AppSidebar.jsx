// mostly shadcn library, boilerplate code from https://ui.shadcn.com/docs/components/sidebar, own formatting

import { Home, Inbox, Settings, BookText } from "lucide-react";
import { UserInfo } from "../context/UserContext";
import { useNavigate, useLocation } from "react-router-dom";

const INBOX_TITLE = "Inbox";
const PORTFOLIO_TITLE = "My Portfolios";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

const items = [
  { title: "Home", url: "/home", icon: Home },
  { title: INBOX_TITLE, url: "/inbox", icon: Inbox },
  { title: PORTFOLIO_TITLE, url: "/portfolios", icon: BookText },
  { title: "Settings", url: "/settings", icon: Settings },
];

const AppSidebar = ({ numberOfNotifications }) => {
  const { isGuest } = UserInfo();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sidebar className="border-r border-white/6 pt-14">
      <SidebarContent>
        <SidebarGroup className="px-3 pt-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                if (
                  (item.title === INBOX_TITLE || item.title === PORTFOLIO_TITLE) &&
                  isGuest === true
                ) return null;

                const isActive = location.pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.url)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "!bg-white/10 !text-white border border-white/20"
                          : "!text-gray-400 hover:!text-white hover:!bg-white/6"
                      }`}
                    >
                      <item.icon
                        className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`}
                      />
                      <span>{item.title}</span>
                      {item.title === INBOX_TITLE && numberOfNotifications > 0 && (
                        <span className="ml-auto text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                          {numberOfNotifications}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;

import { useState } from "react";
import { BASE_URL } from "../lib/utils";
import { useNavigate } from "react-router-dom";
import { UserInfo } from "../context/UserContext";
import { Search } from "lucide-react";

const SearchBar = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { setSelectedId } = UserInfo();
  const navigate = useNavigate();

  const handleInputChange = async (e) => {
    setSearchQuery(e.target.value);
    if (!e.target.value) {
      setSearchResults([]);
      return;
    }
    const response = await fetch(
      `${BASE_URL}/getters/search/${e.target.value}`,
      { credentials: "include" }
    );
    if (response.ok) {
      setSearchResults(await response.json());
    }
  };

  const handleSelect = (value) => {
    const url =
      value.isPublic != null
        ? `/portfolios/${value.id}`
        : `/CompanyInfo/${value.id}`;
    setSelectedId(value.id);
    navigate(url);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="relative w-96">
      <div className="flex items-center gap-2 bg-white/6 border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-emerald-500/40 focus-within:bg-white/8 transition-all duration-200">
        <Search className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search companies or portfolios…"
          className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
          value={searchQuery}
          onChange={handleInputChange}
          autoComplete="off"
        />
      </div>
      {searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f0f14] border border-white/10 rounded-lg overflow-hidden z-[60] shadow-2xl">
          {searchResults.map((value) => (
            <div
              key={value.id}
              className="px-3 py-2.5 text-sm text-gray-300 hover:bg-white/6 hover:text-white cursor-pointer transition-colors duration-150 border-b border-white/5 last:border-0"
              onClick={() => handleSelect(value)}
            >
              {value.isPublic != null
                ? `${value.name} — portfolio by ${value.user?.username}`
                : `${value.name} (${value.ticker})`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;

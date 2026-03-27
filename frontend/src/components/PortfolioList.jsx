import PortfolioCard from "./PortfolioCard";
import { Button } from "./ui/button"; // from shadCN library
import { Input } from "./ui/input"; // from shadCN library
import { Label } from "./ui/label"; // from shadCN library
import Checkbox from "@mui/material/Checkbox"; // from MUI library
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "./ui/popover"; // from shadCN library
import { BASE_URL } from "../lib/utils";
import { useEffect, useState } from "react";

const NewPortfolioModal = ({ newPortfolio }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
  });

  const handlePublicChange = (event) => {
    setFormData((prevState) => ({
      ...prevState,
      ["isPublic"]: event.target.checked,
    }));
  };

  const handleChange = (event) => {
    const key = event.target.id;
    const value = event.target.value;
    setFormData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="mt-4 px-5 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 hover:border-emerald-500/40 text-sm font-semibold transition-all duration-200">
          + New Portfolio
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-[#0f0f14] border border-white/10" side="bottom">
        <div className="grid gap-4">
          <div className="space-y-1">
            <h4 className="leading-none font-semibold text-white">New Portfolio</h4>
            <p className="text-gray-400 text-sm">Set the initial information</p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="Name" className="text-gray-300">Name</Label>
              <Input
                id="name"
                placeholder="Portfolio Name"
                className="col-span-2 h-8 bg-white/8 border-white/15 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Input
                id="description"
                placeholder="Description"
                className="col-span-2 h-8 bg-white/8 border-white/15 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="isPublic" className="text-gray-300">Public?</Label>
              <Checkbox
                id="isPublic"
                className="col-span-2 h-8"
                checked={formData.isPublic}
                onChange={handlePublicChange}
                sx={{ color: "white", "&.Mui-checked": { color: "white" }, padding: 0 }}
              />
            </div>
            <PopoverClose asChild>
              <button
                className="w-full py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 text-sm font-semibold transition-all duration-200"
                onClick={() => newPortfolio(formData)}
              >
                Create Portfolio
              </button>
            </PopoverClose>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const PortfolioList = () => {
  const [portfolios, setPortfolios] = useState(null);

  const newPortfolio = async (newData) => {
    if (newData.name == "" || newData.description == "") {
      alert("please fill out all inputs");
      return;
    }
    const response = await fetch(`${BASE_URL}/portfolios/`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newData),
    });
    if (response.ok) {
      getPortfolios();
    }
  };

  const getPortfolios = async () => {
    const response = await fetch(`${BASE_URL}/portfolios/`, {
      method: "GET",
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json();
      setPortfolios(data);
    }
  };

  useEffect(() => {
    getPortfolios();
  }, []);

  return (
    <div className="w-full px-6 pb-10">
      {portfolios == null ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {portfolios.map((portfolio) => (
            <PortfolioCard
              key={portfolio.id}
              name={portfolio.name}
              id={portfolio.id}
              companies={portfolio.companiesIds}
              description={portfolio.description}
              setPortfolios={setPortfolios}
              canDelete={true}
            />
          ))}
        </div>
      )}
      <div className="flex justify-center mt-6">
        <NewPortfolioModal newPortfolio={newPortfolio} />
      </div>
    </div>
  );
};

export default PortfolioList;

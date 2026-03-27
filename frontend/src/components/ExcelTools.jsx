import { useState } from "react";
import { BASE_URL } from "../lib/utils";
import { Input } from "./ui/input"; // from shadCN library
import { Label } from "./ui/label"; // from shadCN library

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverClose,
} from "./ui/popover"; // shadCn

const ExcelTools = ({ companyId }) => {
  const [formData, setFormData] = useState({
    years: 5,
    description: "",
    isPublic: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (event) => {
    const key = event.target.id;
    const value = event.target.value;
    if (parseInt(value) > 8) {
      alert("please choose a reasonable amount of years (ie - < 8)");
      return;
    }
    setFormData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const beginExcelGeneration = async (event) => {
    if (parseInt(formData.years) == 0 || formData.years == "") {
      alert("you must generate at least one year");
      event.preventDefault();
      return;
    }
    setIsGenerating(true);
    const response = await fetch(
      `${BASE_URL}/excel/generate-model-tcm/${companyId}`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ years: formData.years }),
      }
    );
    setIsGenerating(false);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "historicals.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (companyId == null) {
    return;
  }

  return (
    <div className="flex items-center gap-3">
      {!isGenerating ? (
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 text-sm font-semibold transition-all duration-200">
              ⬇ Download Historical Model
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 bg-[#0f0f14] border border-white/10 shadow-2xl" side="top">
            <div className="grid gap-4">
              <div>
                <h4 className="font-semibold text-white text-sm">Historical Model</h4>
                <p className="text-gray-400 text-xs mt-0.5">Income statement, balance sheet &amp; cash flow — formatted Excel</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-3">
                <Label htmlFor="years" className="text-gray-300 text-sm">Years</Label>
                <Input
                  id="years"
                  type="number"
                  min="1"
                  max="8"
                  className="col-span-2 h-8 bg-white/8 border-white/15 text-white text-sm"
                  onChange={handleChange}
                  value={formData.years}
                />
              </div>
              <p className="text-xs text-gray-500">Max 8 years of annual data</p>
              <PopoverClose asChild>
                <button
                  onClick={beginExcelGeneration}
                  className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors duration-200"
                >
                  Generate &amp; Download
                </button>
              </PopoverClose>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          Generating model…
        </div>
      )}
    </div>
  );
};

export default ExcelTools;

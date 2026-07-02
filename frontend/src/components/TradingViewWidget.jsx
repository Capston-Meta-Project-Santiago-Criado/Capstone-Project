import React, { useEffect, useRef, memo, useState } from "react";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "./ui/separator";
import { BASE_URL } from "../lib/utils";
import { useParams } from "react-router-dom";

const TradingViewScrollArea = ({ info }) => {
  const [allDocuments, setAllDocuments] = useState([]);
  const { selectedId } = useParams();

  useEffect(() => {
    const getAllDocuments = async () => {
      const response = await fetch(
        `${BASE_URL}/getters/documents/${selectedId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const allDocs = await response.json();
      setAllDocuments(allDocs);
    };
    getAllDocuments();
  }, [selectedId]);

  if (info == null) {
    return;
  }

  return (
    <ScrollArea className="h-125 w-full xl:w-90 shrink-0 rounded-xl border border-white/8 bg-[#0f0f14]">
      <div className="p-5">
        {allDocuments.length == 0 && (
          <img
            className="w-20 h-20 mr-auto ml-auto mt-20"
            src="https://i.gifer.com/ZKZg.gif"
          />
        )}
        {allDocuments.length != 0 && (
          <>
            <h4 className="mb-4 text-sm font-mono uppercase tracking-wider text-gray-400">
              Major Filings <span className="text-gray-600 normal-case">(by date filed)</span>
            </h4>
            {allDocuments != null &&
              allDocuments.map((document) => {
                const date = new Date(document.filed_date);
                return (
                  <React.Fragment key={document.id}>
                    <a href={document.url} target="_blank">
                      <div className="flex items-baseline justify-between gap-3 text-sm text-gray-300 hover:text-emerald-400 hover:cursor-pointer transition-colors duration-150">
                        <span className="font-semibold">{document.type}</span>
                        <span className="text-xs text-gray-500 shrink-0">{date.toDateString()}</span>
                      </div>
                    </a>
                    <Separator className="my-2 bg-white/8" />
                  </React.Fragment>
                );
              })}
          </>
        )}
      </div>
    </ScrollArea>
  );
};

function TradingViewWidget({ info }) {
  const container = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (info == null || container.current == null || loadedRef.current) {
      return;
    }
    loadedRef.current = true;
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = `
        {
          "lineWidth": 2,
          "lineType": 0,
          "chartType": "area",
          "fontColor": "rgb(148, 152, 161)",
          "gridLineColor": "rgba(255, 255, 255, 0.06)",
          "volumeUpColor": "rgba(34, 171, 148, 0.5)",
          "volumeDownColor": "rgba(247, 82, 95, 0.5)",
          "backgroundColor": "#0f0f14",
          "widgetFontColor": "#d1d5db",
          "upColor": "#22ab94",
          "downColor": "#f7525f",
          "borderUpColor": "#22ab94",
          "borderDownColor": "#f7525f",
          "wickUpColor": "#22ab94",
          "wickDownColor": "#f7525f",
          "colorTheme": "dark",
          "isTransparent": false,
          "locale": "en",
          "chartOnly": false,
          "scalePosition": "right",
          "scaleMode": "Normal",
          "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
          "valuesTracking": "1",
          "changeMode": "price-and-percent",
          "symbols": [
            [
              "${info.name}",
              "${info.ticker} |1D"
            ]
          ],
          "dateRanges": [
            "1d|1",
            "1m|30",
            "3m|60",
            "12m|1D",
            "60m|1W",
            "all|1M"
          ],
          "fontSize": "10",
          "headerFontSize": "medium",
          "autosize": true,
          "height": "100%",
          "width": "100%", 
          "noTimeScale": false,
          "hideDateRanges": false,
          "hideMarketStatus": false,
          "hideSymbolLogo": false
        }`;
    container.current.appendChild(script);
  }, [info]);

  return (
    <div className="flex flex-col xl:flex-row gap-5 w-full">
      <div className="flex-1 min-w-0 h-125 rounded-xl border border-white/8 bg-[#0f0f14] overflow-hidden">
        <div
          className="tradingview-widget-container"
          style={{ width: "100%", height: "100%" }}
          ref={container}
        ></div>
      </div>
      {info && <TradingViewScrollArea info={info} />}
    </div>
  );
}

export default memo(TradingViewWidget);
export { TradingViewScrollArea };

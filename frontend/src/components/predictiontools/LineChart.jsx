import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import annotationPlugin from "chartjs-plugin-annotation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

const GRID_COLOR = "rgba(255,255,255,0.07)";
const TICK_COLOR = "rgba(255,255,255,0.45)";
const LABEL_COLOR = "rgba(255,255,255,0.6)";

const LineChart = ({
  portfolioName,
  historicalData,
  predictionData,
  predictedShifts,
  isLoading,
}) => {
  const buildShifts = (dates) => {
    const annotations = {};
    dates.forEach((val, i) => {
      annotations[`line${i}`] = {
        type: "line",
        scaleID: "x",
        value: val.date,
        borderColor: "rgba(251,191,36,0.8)",
        borderWidth: 1.5,
        borderDash: [4, 4],
        label: {
          display: true,
          content: `${val.name} earnings`,
          position: "start",
          padding: 4,
          color: "rgba(251,191,36,1)",
          backgroundColor: "rgba(251,191,36,0.12)",
          font: { size: 10 },
        },
      };
    });
    return annotations;
  };

  const datasets = [];

  if (historicalData?.length > 0) {
    const isUp = historicalData[historicalData.length - 1].value >= historicalData[0].value;
    const lineRgb = isUp ? "52,211,153" : "248,113,113";
    datasets.push({
      label: "Portfolio Value",
      data: historicalData.map((v) => ({ x: v.date, y: v.value })),
      borderColor: `rgba(${lineRgb},1)`,
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return `rgba(${lineRgb},0.15)`;
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, `rgba(${lineRgb},0.35)`);
        gradient.addColorStop(0.5, `rgba(${lineRgb},0.12)`);
        gradient.addColorStop(1, `rgba(${lineRgb},0)`);
        return gradient;
      },
      borderWidth: 2.5,
      tension: 0.3,
      fill: true,
      pointRadius: 0,
      order: 1,
    });
  }

  if (predictionData?.length > 0) {
    datasets.push({
      label: "Base Forecast",
      data: predictionData.map((v) => ({ x: v.date, y: v.price })),
      borderColor: "rgba(52,211,153,1)",
      backgroundColor: "rgba(52,211,153,0.06)",
      borderWidth: 2,
      borderDash: [6, 4],
      tension: 0,
      fill: false,
      pointRadius: 0,
      order: 2,
    });
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: TICK_COLOR,
          boxWidth: 12,
          font: { size: 11 },
          padding: 16,
          filter: () => true,
        },
      },
      title: {
        display: !!portfolioName,
        text: portfolioName,
        color: "rgba(255,255,255,0.8)",
        font: { size: 13, weight: "600" },
        padding: { bottom: 8 },
      },
      tooltip: {
        backgroundColor: "rgba(15,15,20,0.95)",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        titleColor: "rgba(255,255,255,0.9)",
        bodyColor: "rgba(255,255,255,0.65)",
        callbacks: {
          label: (ctx) =>
            ` ${ctx.dataset.label}: $${parseFloat(ctx.parsed.y).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
        },
      },
      annotation: {
        annotations: buildShifts(predictedShifts ?? []),
      },
    },
    scales: {
      x: {
        ticks: { color: TICK_COLOR, maxTicksLimit: 8, maxRotation: 0, font: { size: 10 } },
        grid: { color: GRID_COLOR },
        border: { color: GRID_COLOR },
      },
      y: {
        ticks: {
          color: TICK_COLOR,
          font: { size: 10 },
          callback: (v) => `$${v.toLocaleString()}`,
        },
        grid: { color: GRID_COLOR },
        border: { color: GRID_COLOR },
        title: {
          display: true,
          text: "Portfolio Value ($)",
          color: LABEL_COLOR,
          font: { size: 11 },
        },
      },
    },
    elements: { point: { radius: 0 } },
  };

  if (datasets.length === 0) {
    if (isLoading) return null;
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <p className="text-gray-500 text-sm">No chart data available</p>
        <p className="text-gray-600 text-xs">Run predictions or try a different time frame</p>
      </div>
    );
  }

  return <Line options={options} data={{ datasets }} />;
};

export default LineChart;

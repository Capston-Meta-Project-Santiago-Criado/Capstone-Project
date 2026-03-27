import PortfolioList from "./components/PortfolioList";

const Portfolios = () => (
  <main className="w-full min-h-screen">
    <div className="px-8 pt-10 pb-4">
      <p className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase mb-1">
        Your Portfolios
      </p>
      <h3 className="text-3xl font-bold text-white">Portfolios</h3>
      <div className="mt-2 w-12 h-0.5 bg-emerald-400/60 rounded-full" />
    </div>
    <PortfolioList />
  </main>
);

export default Portfolios;

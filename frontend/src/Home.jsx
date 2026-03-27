import CompanyList from "./components/CompanyList";
import PublicPortfolios from "./components/PublicPortfolio";

const SectionHeading = ({ label, sub }) => (
  <div className="self-start ml-8 mt-12 mb-6">
    <p className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase mb-1">
      {sub}
    </p>
    <h3 className="text-3xl font-bold text-white">{label}</h3>
    <div className="mt-2 w-12 h-0.5 bg-emerald-400/60 rounded-full" />
  </div>
);

const Home = () => (
  <main className="w-full min-h-screen">
    <div className="flex flex-col items-center">
      <SectionHeading label="Recommended Companies" sub="Market Highlights" />
      <CompanyList />
      <SectionHeading label="Curated Portfolios" sub="Community Picks" />
      <PublicPortfolios />
    </div>
  </main>
);

export default Home;

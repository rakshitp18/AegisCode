import Navbar from "../components/common/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";

function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Hero />
      <Features />
    </div>
  );
}

export default Landing;
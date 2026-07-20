import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col items-center justify-center text-center mt-24 px-6">
      <h1 className="text-6xl font-extrabold text-white">
        AI Code Validation
      </h1>

      <h2 className="text-6xl font-extrabold text-blue-500 mt-2">
        & Testing Agent
      </h2>

      <p className="text-gray-400 text-xl mt-8 max-w-3xl">
        Upload your source code and let AI detect bugs,
        generate unit tests, explain algorithms,
        and improve your software quality.
      </p>

      <button
        onClick={() => navigate("/workspace")}
        className="mt-10 bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl text-lg font-semibold transition duration-300"
      >
        Analyze Code
      </button>
    </section>
  );
}

export default Hero;
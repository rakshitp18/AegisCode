function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-6 hover:bg-slate-700 transition duration-300 shadow-lg">

      <div className="text-4xl mb-4">
        {icon}
      </div>

      <h2 className="text-xl font-bold mb-2">
        {title}
      </h2>

      <p className="text-gray-400">
        {description}
      </p>

    </div>
  );
}

export default FeatureCard;
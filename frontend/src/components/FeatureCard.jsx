function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-[#141414]/40 border border-white/5 hover:border-white/10 hover:bg-[#1a1a1a]/60 rounded-2xl p-6 hover:shadow-xl hover:shadow-white/[0.02] transition-all duration-300 backdrop-blur-sm group select-none">
      <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 w-fit">
        {icon}
      </div>
      <h2 className="text-lg font-bold mb-2 text-white/90 group-hover:text-white transition-colors">
        {title}
      </h2>
      <p className="text-xs text-white/60 leading-relaxed font-sans">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;
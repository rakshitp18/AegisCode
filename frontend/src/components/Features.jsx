import FeatureCard from "./FeatureCard";

function Features() {

  const features = [

    {
      icon: "🐞",
      title: "Bug Detection",
      description: "Find logical errors and potential bugs."
    },

    {
      icon: "🧪",
      title: "Unit Test Generator",
      description: "Generate intelligent unit tests automatically."
    },

    {
      icon: "⚡",
      title: "AI Code Review",
      description: "Receive professional code review suggestions."
    },

    {
      icon: "📊",
      title: "Complexity Analysis",
      description: "Analyze time and space complexity."
    },

    {
      icon: "🔒",
      title: "Security Scan",
      description: "Identify common security vulnerabilities."
    },

    {
      icon: "📚",
      title: "Code Explanation",
      description: "Understand unfamiliar code instantly."
    }

  ];

  return (

    <section className="py-24 px-10">

      <h2 className="text-4xl font-bold text-center mb-14">

        Why Choose AegisCode?

      </h2>

      <div className="grid md:grid-cols-3 gap-8">

        {features.map((feature, index) => (

          <FeatureCard

            key={index}

            icon={feature.icon}

            title={feature.title}

            description={feature.description}

          />

        ))}

      </div>

    </section>

  );

}

export default Features;
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-8">
      {/* Hero */}
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          LinkedIn Post Writer{" "}
          <span className="text-blue-600">Powered by AI Agents</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          Generate scroll-stopping LinkedIn posts in seconds. Provide your own topic or let
          our AI discover what&apos;s trending in your industry right now.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/generate?mode=topic"
          className="rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
        >
          ✍️ Write on My Topic
        </Link>
        <Link
          href="/generate?mode=trending"
          className="rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          🔥 Use Trending Topic
        </Link>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8 w-full max-w-3xl">
        {[
          {
            icon: "🔍",
            title: "Trend Research",
            desc: "Automatically discovers what professionals are buzzing about on LinkedIn today.",
          },
          {
            icon: "🧠",
            title: "Multi-Agent Pipeline",
            desc: "4 specialized AI agents — Researcher, Planner, Drafter, Editor — work in sequence.",
          },
          {
            icon: "📋",
            title: "LinkedIn-Optimized",
            desc: "Posts follow LinkedIn best practices: strong hooks, 1300 chars, hashtags, clear CTA.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-gray-200 bg-white p-5 text-left dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="text-2xl mb-2">{f.icon}</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{f.title}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

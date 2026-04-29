const footerGroups = [
  {
    title: "A2A Trip",
    links: [
      "About the planner",
      "AI trip support",
      "Save trips",
      "Wishlist",
      "Route help",
      "Budget guidance",
      "Travel checklist",
    ],
  },
  {
    title: "Popular searches",
    links: [
      "Flights from Kolkata to Bengaluru",
      "Hotels in Goa",
      "Things to do in Dubai",
      "Weekend trips from Delhi",
      "Hotels in Manali",
      "Flights to Singapore",
      "Bali trip ideas",
    ],
  },
  {
    title: "Travel help",
    links: [
      "Packing list",
      "Travel documents",
      "Route feasibility",
      "Hotel guidance",
      "Flight suggestions",
      "Trip safety",
      "Currency settings",
    ],
  },
  {
    title: "Destinations",
    links: [
      "Goa",
      "Bali",
      "Maldives",
      "Dubai",
      "Singapore",
      "Bangkok",
      "Jaipur",
      "Manali",
      "Tokyo",
      "Paris",
    ],
  },
];

const highlights = [
  {
    emoji: "✈️",
    title: "Plan routes",
    text: "Check practical ways to travel between your source and destination.",
  },
  {
    emoji: "🏨",
    title: "Find stays",
    text: "Explore hotel, home and stay ideas for your destination.",
  },
  {
    emoji: "🗺️",
    title: "Explore places",
    text: "See things to do, local experiences and trip ideas.",
  },
  {
    emoji: "🤖",
    title: "Ask AI",
    text: "Use trip-aware support for route, budget, packing and documents.",
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <section className="mx-auto w-full max-w-[1700px] px-4 py-12 sm:px-6 lg:px-10 xl:px-12">
        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 shadow-sm sm:p-8 lg:p-10">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-600">
            Explore more with A2A Trip
          </p>

          <h2 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Plan, compare and organize your travel in one place
          </h2>

          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
            A2A Trip helps you explore routes, stays, activities, budgets and
            travel decisions in one clean workflow. Use the planner, save trips,
            ask the AI assistant and make travel planning easier.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                  {item.emoji}
                </div>

                <h3 className="mt-4 text-lg font-black tracking-[-0.02em] text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1700px] px-4 pb-10 sm:px-6 lg:px-10 xl:px-12">
        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-950">
                  {group.title}
                </h3>

                <div className="mt-4 flex flex-wrap gap-x-2 gap-y-2 text-[15px] leading-7 text-slate-600">
                  {group.links.map((link, index) => (
                    <span key={link}>
                      <a href="#" className="transition hover:text-blue-600">
                        {link}
                      </a>
                      {index !== group.links.length - 1 && (
                        <span className="text-slate-300">, </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-8 px-4 py-10 text-white sm:px-6 lg:px-10 xl:px-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-black tracking-[-0.03em] text-white">
                A2A Trip
              </h3>

              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                Intelligent Travel Planner
              </p>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">
                Plan routes, compare travel modes, discover stays, explore
                things to do and use AI support for smarter travel decisions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://www.instagram.com/sohammsanyal/?next=&hl=en"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                📸 Instagram
              </a>

              <a
                href="https://www.linkedin.com/in/soham6969/"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                💼 LinkedIn
              </a>

              <a
                href="https://sohamsanyal.info"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                🌍 Portfolio
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
            <p>© 2026 A2A Trip. Built for smarter travel planning.</p>

            <div className="flex flex-wrap items-center gap-5">
              <a href="#" className="transition hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="transition hover:text-white">
                Terms of Service
              </a>
              <a href="#" className="transition hover:text-white">
                Help Center
              </a>
              <a href="#" className="transition hover:text-white">
                Contact Support
              </a>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
            <p className="font-bold text-white">Built by Soham</p>
            <p className="mt-2">
              Want to see more projects and work? Visit{" "}
              <a
                href="https://sohamsanyal.info"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-cyan-300 hover:text-cyan-200"
              >
                sohamsanyal.info 🌍
              </a>
            </p>
          </div>
        </div>
      </section>
    </footer>
  );
}
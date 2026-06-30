export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-violet-500 p-6 text-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-3xl bg-white/10 p-8 backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-100">SpendSmart</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Track every expense with clarity.</h1>
          <p className="mt-4 max-w-2xl text-lg text-indigo-100">
            Manage your budget, review your transactions, and stay on top of your spending in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="/dashboard" className="rounded-xl bg-white px-5 py-3 font-medium text-indigo-700">Open dashboard</a>
          <a href="/transactions" className="rounded-xl border border-white/30 px-5 py-3 font-medium text-white">View transactions</a>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { createApiClientWithAuth } from "../utils/api";

const periods = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
  { label: "All", value: "all" },
];

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [period, setPeriod] = useState("monthly");
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ amount: "", date: new Date().toISOString().slice(0, 10) });
  const [message, setMessage] = useState(null);

  const periodLabel = useMemo(() => periods.find((item) => item.value === period)?.label || "All", [period]);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const api = await createApiClientWithAuth(() => getToken());
      const response = await api.get(`/summary?period=${period}`);
      setSummary(response.data.data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [period]);

  const handleIncomeChange = (event) => {
    const { name, value } = event.target;
    setIncomeForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleIncomeSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    const amount = parseFloat(incomeForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setMessage("Enter a valid amount greater than 0.");
      return;
    }

    try {
      const api = await createApiClientWithAuth(() => getToken());
      await api.post("/transactions", {
        type: "income",
        amount,
        category: "Income",
        date: incomeForm.date,
      });
      setIncomeForm((prev) => ({ ...prev, amount: "" }));
      loadSummary();
      setMessage("Income added successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Dashboard</h2>
            <p className="mt-1 text-sm text-gray-500">View income, expenses, and quick summaries.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {periods.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${period === item.value ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {message && <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">{message}</div>}

        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <div className="rounded-3xl border border-gray-100 bg-slate-50 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Total Income</p>
            <p className="mt-3 text-3xl font-semibold">₹{summary?.totalIncome?.toLocaleString() ?? "0"}</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-slate-50 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Total Expense</p>
            <p className="mt-3 text-3xl font-semibold">₹{summary?.totalExpense?.toLocaleString() ?? "0"}</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-slate-50 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500">Balance</p>
            <p className="mt-3 text-3xl font-semibold">₹{summary ? (summary.balance || 0).toLocaleString() : "0"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">Add Income</h3>
            <p className="mt-1 text-sm text-gray-500">Record new income quickly and keep the dashboard updated.</p>
          </div>
        </div>

        <form onSubmit={handleIncomeSubmit} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Amount</span>
            <input
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={incomeForm.amount}
              onChange={handleIncomeChange}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Date</span>
            <input
              name="date"
              type="date"
              value={incomeForm.date}
              onChange={handleIncomeChange}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
            />
          </label>

          <button
            type="submit"
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Add Income
          </button>
        </form>
      </div>

      {isLoading && <div className="rounded-3xl bg-white p-6 shadow-sm text-center text-sm text-gray-500">Loading summary...</div>}

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Expense Snapshot</h3>
        <p className="mt-2 text-sm text-gray-500">Showing total expense for {periodLabel}.</p>
        <div className="mt-6 rounded-3xl bg-red-50 p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-red-600">Expense total</p>
          <p className="mt-3 text-4xl font-semibold text-red-700">₹{summary?.totalExpense?.toLocaleString() ?? "0"}</p>
        </div>
      </div>
    </div>
  );
}

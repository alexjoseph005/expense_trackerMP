import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { createApiClientWithAuth } from "../utils/api";

const periods = [
  { label: "All", value: "all" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const sorts = [
  { label: "Newest", value: "date_desc" },
  { label: "Oldest", value: "date_asc" },
  { label: "Amount high → low", value: "amount_desc" },
  { label: "Amount low → high", value: "amount_asc" },
];

export default function TransactionsPage() {
  const { getToken } = useAuth();
  const [period, setPeriod] = useState("all");
  const [sort, setSort] = useState("date_desc");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const api = await createApiClientWithAuth(() => getToken());
      const response = await api.get(
        `/transactions?period=${period}&sort=${sort}&search=${encodeURIComponent(search)}${category ? `&category=${encodeURIComponent(category)}` : ""}`
      );
      setTransactions(response.data.data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const api = await createApiClientWithAuth(() => getToken());
      const response = await api.get("/categories");
      setCategories(response.data.data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [period, sort, category]);

  const handleExpenseChange = (event) => {
    const { name, value } = event.target;
    setExpenseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    const amount = parseFloat(expenseForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setMessage("Enter a valid amount greater than 0.");
      return;
    }
    if (!expenseForm.category) {
      setMessage("Please select a category for the expense.");
      return;
    }

    try {
      const api = await createApiClientWithAuth(() => getToken());
      await api.post("/transactions", {
        type: "expense",
        amount,
        category: expenseForm.category,
      });
      setExpenseForm({ amount: "", category: "" });
      loadTransactions();
      setMessage("Expense added successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Transactions</h2>
            <p className="mt-1 text-sm text-gray-500">View and sort your expense and income history.</p>
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

        <form onSubmit={handleExpenseSubmit} className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Amount</span>
            <input
              type="number"
              name="amount"
              min="0"
              step="0.01"
              value={expenseForm.amount}
              onChange={handleExpenseChange}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
              required
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Category</span>
            <select
              name="category"
              value={expenseForm.category}
              onChange={handleExpenseChange}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
              required
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Add Expense
          </button>
        </form>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category"
            className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
          >
            {sorts.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        {isLoading ? (
          <p className="mt-4 text-sm text-gray-500">Loading transactions...</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">Type</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-900">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-6 text-center text-sm text-gray-500">
                      No transactions found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td className="px-4 py-4 text-gray-700">{new Date(transaction.date).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-gray-700">{transaction.type}</td>
                      <td className="px-4 py-4 text-gray-700">{transaction.category}</td>
                      <td className={`px-4 py-4 font-semibold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        ₹{transaction.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

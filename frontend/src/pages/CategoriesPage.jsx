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

export default function CategoriesPage() {
  const { getToken } = useAuth();
  const [categories, setCategories] = useState([]);
  const [period, setPeriod] = useState("all");
  const [chartData, setChartData] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadCategories = async () => {
    try {
      const api = await createApiClientWithAuth(() => getToken());
      const response = await api.get("/categories");
      setCategories(response.data.data);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const loadChartData = async () => {
    setIsLoading(true);
    try {
      const api = await createApiClientWithAuth(() => getToken());
      const response = await api.get(`/summary/by-category?period=${period}`);
      setChartData(response.data.data);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadChartData();
  }, [period]);

  const totalValue = useMemo(() => chartData.reduce((sum, item) => sum + item.total, 0), [chartData]);

  const handleCreateCategory = async (event) => {
    event.preventDefault();
    setMessage(null);
    try {
      const api = await createApiClientWithAuth(() => getToken({ template: "default" }));
      await api.post("/categories", newCategory);
      setNewCategory({ name: "" });
      loadCategories();
      setMessage("Category added successfully.");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Categories</h2>
            <p className="mt-1 text-sm text-gray-500">Add categories and view category expenses with period filters.</p>
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

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-100 bg-slate-50 p-5">
            <h3 className="text-lg font-semibold">New Category</h3>
            <form onSubmit={handleCreateCategory} className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                value={newCategory.name}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                required
              />
              <button type="submit" className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                Add Category
              </button>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-gray-100 bg-slate-50 p-5">
              <h3 className="text-lg font-semibold">Category Expense Breakdown</h3>
              {isLoading ? (
                <p className="mt-4 text-sm text-gray-500">Loading chart data...</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {chartData.length === 0 ? (
                    <div className="rounded-3xl bg-white p-5 text-sm text-gray-500">No category expense data available.</div>
                  ) : (
                    <div className="space-y-3">
                      {chartData.map((item) => {
                        const percentage = totalValue ? ((item.total / totalValue) * 100).toFixed(1) : 0;
                        return (
                          <div key={item._id} className="rounded-3xl bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{item._id}</p>
                                <p className="text-xs text-gray-500">{percentage}% of total</p>
                              </div>
                              <p className="text-sm font-semibold text-indigo-700">₹{item.total.toLocaleString()}</p>
                            </div>
                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

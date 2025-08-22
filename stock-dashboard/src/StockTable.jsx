import { useState, useEffect, useRef } from "react";
import Spinner from "./Spinner";

export default function StockTable() {
  const [stocks, setStocks] = useState([]); // Stock data
  const [loading, setLoading] = useState(false); // Loading state
  const [usingSampleData, setUsingSampleData] = useState(false); // Fallback flag
  const [source, setSource] = useState(""); // Data source

  const symbols = ["AAPL", "MSFT", "GOOGL", "TSLA"];
  const didFetch = useRef(false); // Prevent duplicate fetch

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    const cached = localStorage.getItem("stocks");
    const cacheTime = localStorage.getItem("stocks_time");
    const now = Date.now();

    // // Use cached data if less than 2 mins old(since have limited free requests)
    if (cached && cacheTime && now - cacheTime < 2 * 60 * 1000) {
      setStocks(JSON.parse(cached));
      setUsingSampleData(false);
    } else {
      fetchStocks();
    }
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    setUsingSampleData(false);

    let results = [];

    try {
      // Try Alpha Vantage API
      results = await Promise.all(
        symbols.map(async (symbol) => {
          const res = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${import.meta.env.VITE_ALPHAVANTAGE_API_KEY}`
          );
          const data = await res.json();
          const quote = data["Global Quote"];
          if (!quote) return null;

          return {
            symbol: quote["01. symbol"],
            price: parseFloat(quote["05. price"]),
            change: (
              ((parseFloat(quote["05. price"]) - parseFloat(quote["08. previous close"])) /
                parseFloat(quote["08. previous close"])) *
              100
            ).toFixed(2),
          };
        })
      );

      results = results.filter(Boolean);
      if (results.length) setSource("Alpha Vantage");

      // Fallback to Finnhub if needed
      if (!results.length) {
        results = await Promise.all(
          symbols.map(async (symbol) => {
            const res = await fetch(
              `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${import.meta.env.VITE_FINNHUB_API_KEY}`
            );
            const data = await res.json();
            if (!data || !data.c) return null;

            return {
              symbol,
              price: data.c,
              change: (((data.c - data.pc) / data.pc) * 100).toFixed(2),
            };
          })
        );

        results = results.filter(Boolean);
        if (results.length) setSource("Finnhub");
      }

      setStocks(results);
      localStorage.setItem("stocks", JSON.stringify(results));
      localStorage.setItem("stocks_time", Date.now().toString());
    } catch (error) {
      // Use cache or sample data if fetch fails
      const cached = localStorage.getItem("stocks");
      if (cached) {
        setStocks(JSON.parse(cached));
        setSource("Cache");
      } else {
        setUsingSampleData(true);
        setStocks([
          { symbol: "AAPL", price: 172, change: 1.2 },
          { symbol: "MSFT", price: 320, change: -0.8 },
          { symbol: "GOOGL", price: 135, change: 0.5 },
          { symbol: "TSLA", price: 275, change: 2.1 },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  {/* show spinner while loading */}
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Spinner />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Stock Market Overview
          </h1>
          <p className="text-gray-600">
            Real-time stock prices and daily changes
            {source ? " from " : ""}
            <span className="font-semibold text-gray-900">{source}</span>
          </p>
        </div>

        {/* Sample data warning */}
        {usingSampleData && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded text-center">
            ⚠️ Real-time data unavailable. Showing sample data.
          </div>
        )}

        {/* Stock table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900 uppercase tracking-wider">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stocks.map((stock, index) => (
                  <tr
                    key={stock.symbol}
                    className={`hover:bg-gray-50 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 text-lg">{stock.symbol}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-lg font-medium text-gray-900">${stock.price.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          stock.change >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {stock.change >= 0 ? "+" : ""}
                        {stock.change}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="sm:hidden divide-y divide-gray-200">
            {stocks.map((stock) => (
              <div key={stock.symbol} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{stock.symbol}</h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      stock.change >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {stock.change >= 0 ? "+" : ""}
                    {stock.change}%
                  </span>
                </div>
                <div className="text-xl font-medium text-gray-900">${stock.price.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh button */}
        <div className="mt-6 text-center">
          <button
            onClick={fetchStocks}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";

export default function StockTable() {
  // State to hold stock data
  const [stocks, setStocks] = useState([]);
  // Loading indicator for fetch operations
  const [loading, setLoading] = useState(false);
  // Flag to indicate if sample data is being used
  const [usingSampleData, setUsingSampleData] = useState(false);
  //  source of stock data 
  const [source, setSource] = useState("");

  // List of stock symbols to fetch
  const symbols = ["AAPL", "MSFT", "GOOGL", "TSLA"];

  
  useEffect(() => {
    setSource(""); // reset source
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    setUsingSampleData(false);

    let results = [];

    try {
      // Try fetching data from Alpha Vantage
      results = await Promise.all(
        symbols.map(async (symbol) => {
          const res = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${import.meta.env.VITE_ALPHAVANTAGE_API_KEY}`
          );
          const data = await res.json();
          const quote = data["Global Quote"];
          if (!quote) return null;

          return {
            symbol,
            price: parseFloat(quote["05. price"]),
            change: (
              ((parseFloat(quote["05. price"]) -
                parseFloat(quote["08. previous close"])) /
                parseFloat(quote["08. previous close"])) *
              100
            ).toFixed(2),
          };
        })
      );

      // Filter out null results
      results = results.filter(Boolean);

      // Set source if Alpha Vantage succeeded
      if (results.length) {
        setSource("Alpha Vantage");
      }

      // If Alpha Vantage failed, try Finnhub
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
      }

      // Set source if Finnhub succeeded
      if (results.length) {
        setSource("Finnhub");
      }

      // If both APIs fail, use sample data
      if (!results.length) {
        setUsingSampleData(true);
        results = [
          { symbol: "AAPL", price: 172, change: 1.2 },
          { symbol: "MSFT", price: 320, change: -0.8 },
          { symbol: "GOOGL", price: 135, change: 0.5 },
          { symbol: "TSLA", price: 275, change: 2.1 },
        ];
      }

      setStocks(results);
    } catch (error) {
      // If fetch fails, show sample data
      console.error("Error fetching stock data:", error);
      setUsingSampleData(true);
      setStocks([
        { symbol: "AAPL", price: 172, change: 1.2 },
        { symbol: "MSFT", price: 320, change: -0.8 },
        { symbol: "GOOGL", price: 135, change: 0.5 },
        { symbol: "TSLA", price: 275, change: 2.1 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Show loading skeleton while fetching
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-6"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
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

        {/* Show warning if using sample data */}
        {usingSampleData && (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded text-center">
            ⚠️ Real-time data is currently unavailable. Showing sample data.
          </div>
        )}

        {/* Stock table container */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop Table */}
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
                          stock.change >= 0
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
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

          {/* Mobile Cards */}
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

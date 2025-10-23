import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const styles = {
  button: {
    background: "linear-gradient(90deg, #000000ff 0%, #000000ff 100%)",
    border: "none",
    borderRadius: "10px",
    padding: "0.6rem 1.4rem",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(255, 255, 255, 0.66)",
    transition: "transform 0.2s ease, opacity 0.2s ease",
  },
  select: {
    backgroundColor: "#111",
    color: "white",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "0.4rem 0.6rem",
    fontWeight: "500",
  },
};

function App() {
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState(""); // ⬅️ start empty
  const [ticker, setTicker] = useState("");     // ⬅️ start empty
  const [notice, setNotice] = useState("");
  const isPositiveTrend =
  data.length > 1 && data[data.length - 1].portfolio_value > data[0].portfolio_value;
  
  async function runBacktest() {
    setLoading(true);
    setNotice(""); // clear any old messages
    let timeoutId;

    try {
      // Show message if backend takes too long
      timeoutId = setTimeout(() => {
        setNotice("The backend is waking up (Render free tier). Please wait a few seconds and try again.");
        // fade out after 6 seconds
        setTimeout(() => setNotice(""), 6000);
      }, 8000);

      const res = await fetch(
        `https://quantvision-backend.onrender.com/run_strategy?name=${strategy}&ticker=${ticker}`
      );

      clearTimeout(timeoutId);

      const json = await res.json();
      if (!json.equity_curve) {
        setNotice("Backend returned no data. Please try again.");
        setData([]);
        setMetrics(null);
        setTimeout(() => setNotice(""), 4000); // fade out that message too
        return;
      }

      const formatted = json.equity_curve.map(([date, value]) => ({
        date,
        portfolio_value: value,
      }));

      setData(formatted);
      setMetrics(json.metrics);
      setNotice(""); // success, clear message
    } catch (err) {
      console.error("Error fetching backtest data:", err);
      setNotice("Backend may still be waking up. Try again in a few seconds.");
      setTimeout(() => setNotice(""), 5000);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }



  return (
    <div
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        height: "100dvh",
        width: "100vw",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        color: "#1a1a1a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "0",
        margin: "0",
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: "3rem",
          marginTop: "1rem",
          fontWeight: 700,
          marginBottom: "2rem",
          letterSpacing: "-0.5px",
        }}
      >
        Quant Strategy Dashboard
      </h1>

      {/* Run Button below title */}
      <div
        style={{
          marginBottom: "2rem",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80px", // keeps layout consistent even before message appears
        }}
      >

        <button
          onClick={runBacktest}
          disabled={!strategy || !ticker || loading}
          style={{
            ...styles.button,
            opacity: !strategy || !ticker ? 0.5 : 1,
            cursor: !strategy || !ticker ? "not-allowed" : "pointer",
          }}
          title={!strategy || !ticker ? "Select strategy and ticker first" : ""} // ✅ tooltip
        >
          {loading ? "Running..." : "Run Backtest"}
        </button>

        {notice && (
          <p
            style={{
              color: "#333",
              fontSize: "0.9rem",
              background: "#f3f4f6",
              padding: "0.7rem 1.2rem",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              marginTop: "1rem",
              textAlign: "center",
              lineHeight: "1.5",
              animation: "fadeIn 0.4s ease-in-out",
              transition: "opacity 0.5s ease",  // 👈 fade-out effect
              opacity: notice ? 1 : 0,
              maxWidth: "420px",
            }}
          >
            {notice}
          </p>
        )}
      </div>

      {/* === Main Layout === */}
      <div className="dashboard-layout">
        {/* === LEFT SIDE: Chart === */}
        <div className="chart-panel">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid stroke="#e0e0e0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => v.slice(5, 10)}
                  stroke="#888"
                />
                <YAxis domain={["auto", "auto"]} stroke="#888" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e0e0e0",
                    borderRadius: "10px",
                  }}
                  labelStyle={{ color: "#333" }}
                />
                <Legend />
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    {isPositiveTrend ? (
                      <>
                        {/* Uptrend = green gradient */}
                        <stop offset="0%" stopColor="#00c853" stopOpacity={1} />
                        <stop offset="100%" stopColor="#a5d6a7" stopOpacity={0.4} />
                      </>
                    ) : (
                      <>
                        {/* Downtrend = red gradient */}
                        <stop offset="0%" stopColor="#d50000" stopOpacity={1} />
                        <stop offset="100%" stopColor="#ef9a9a" stopOpacity={0.4} />
                      </>
                    )}
                  </linearGradient>
                </defs>

                <Line
                  type="monotone"
                  dataKey="portfolio_value"
                  stroke="url(#lineGradient)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 5,
                    stroke: isPositiveTrend ? "#00c853" : "#d50000",
                    strokeWidth: 2,
                    fill: isPositiveTrend ? "#00e676" : "#ef5350",
                  }}
                  name={`${strategy ? strategy.toUpperCase() : "STRATEGY"} Performance`}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: "#888" }}>Run a backtest to view results</p>
          )}
        </div>

        {/* === RIGHT SIDE: Controls + Metrics === */}
        <div className="right-panel">
          <div className="controls">
            <label style={{ display: "block", marginBottom: "10px" }}>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                style={styles.select}
              >
                <option value="" disabled>
                  Strategy
                </option>
                <option value="momentum">Momentum</option>
                <option value="mean_reversion">Mean Reversion</option>
                <option value="sma_crossover">SMA Crossover</option>
              </select>
            </label>

            <label style={{ display: "block", marginBottom: "10px" }}>
              <select
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                style={styles.select}
              >
                <option value="" disabled>
                  Ticker
                </option>
                <option value="AAPL">AAPL</option>
                <option value="MSFT">MSFT</option>
                <option value="TSLA">TSLA</option>
                <option value="GOOG">GOOG</option>
              </select>
            </label>
          </div>

          {metrics && (
            <div className="metrics-container">
              <h3>Performance Metrics</h3>
              <p><strong>Sharpe Ratio:</strong> <span>{metrics.sharpe_ratio}</span></p>
              <p><strong>Max Drawdown:</strong> <span>{metrics.max_drawdown}%</span></p>
              <p><strong>Annual Return:</strong> <span>{metrics.annual_return}%</span></p>
              <p><strong>Volatility:</strong> <span>{metrics.volatility}%</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

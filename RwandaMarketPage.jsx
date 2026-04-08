import { useState, useEffect } from "react";
// TODO (step 5): import { C, S, fmtRWF, toDay, daysDiff } from "../utils/helpers";
// TODO (step 5): import { calcPnL, getMarketPrice, getDailyVariance, RW_BASE_PRICES, MARKETS } from "../utils/farm";
// TODO (step 7): import AIPrediction from "../components/AIPrediction";

/**
 * RwandaMarketPage — extracted from FarmIQ index.html (RwandaMarket function)
 * Props:
 *   pigs, feeds, sales, logs, expenses, incomes,
 *   reproductions, stock, capital
 */
export default function RwandaMarketPage({
  pigs, feeds, sales, logs, expenses, incomes, reproductions, stock, capital,
}) {
  const active = pigs.filter(p => p.status === "active");
  const [weather, setWeather] = useState(null);
  const [weatherErr, setWeatherErr] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [exporting, setExporting] = useState(false);

  // Build smart notifications
  useEffect(() => {
    const n = [];
    const ready = active.filter(p => p.weight >= 80);
    if (ready.length > 0) n.push({ type: "sell", msg: `🐷 ${ready.length} pig${ready.length > 1 ? "s" : ""} are market-ready (80kg+). Best time to sell!`, color: "#16a34a" });
    const lowSt = stock.filter(s => s.quantity <= s.minLevel);
    if (lowSt.length > 0) n.push({ type: "stock", msg: `📦 Low stock alert: ${lowSt.map(s => s.name).join(", ")}`, color: "#d97706" });
    const upcoming = reproductions.filter(r => r.status === "pregnant" && daysDiff(r.expectedFarrow) >= 0 && daysDiff(r.expectedFarrow) <= 7);
    if (upcoming.length > 0) n.push({ type: "farrow", msg: `🐖 ${upcoming.length} sow${upcoming.length > 1 ? "s" : ""} due to farrow within 7 days!`, color: "#7c3aed" });
    const sick = logs.filter(l => l.date === toDay() && l.sick > 0);
    if (sick.length > 0) n.push({ type: "health", msg: `🏥 ${sick.reduce((s, l) => s + (l.sick || 0), 0)} sick pig(s) reported today — check health logs`, color: "#dc2626" });
    if (n.length === 0) n.push({ type: "ok", msg: "✅ All good! No urgent alerts today.", color: "#16a34a" });
    setNotifs(n);
  }, [pigs, stock, reproductions, logs]);

  // Fetch Rwanda weather (Kigali)
  useEffect(() => {
    fetch("https://wttr.in/Kigali,Rwanda?format=j1")
      .then(r => r.json())
      .then(d => {
        const c = d.current_condition[0];
        setWeather({
          temp: c.temp_C,
          feels: c.FeelsLikeC,
          desc: c.weatherDesc[0].value,
          humidity: c.humidity,
          wind: c.windspeedKmph,
          icon: parseInt(c.weatherCode) >= 200 && parseInt(c.weatherCode) < 300 ? "⛈️"
            : parseInt(c.weatherCode) >= 300 && parseInt(c.weatherCode) < 600 ? "🌧️"
            : parseInt(c.weatherCode) >= 600 && parseInt(c.weatherCode) < 700 ? "❄️"
            : parseInt(c.weatherCode) >= 700 && parseInt(c.weatherCode) < 800 ? "🌫️"
            : parseInt(c.weatherCode) === 800 ? "☀️" : "⛅",
        });
      })
      .catch(() => setWeatherErr(true));
  }, []);

  // Excel/CSV Export
  function exportExcel() {
    setExporting(true);
    try {
      const rows = [
        ["FarmIQ — Rwanda Market & Financial Report", "", "", "", ""],
        ["Generated:", toDay(), "", "", ""],
        ["", "", "", "", ""],
        ["=== MARKET PRICES (TODAY) ===", "", "", "", ""],
        ["Category", "Stage/Type", "Base Price (RWF)", "Trend", "Notes"],
        ...Object.entries(RW_BASE_PRICES).map(([k, v]) => [
          k === "heavy" ? "Heavy Pig" : k,
          k === "heavy" ? "80kg+" : v.desc,
          v.base,
          v.trend === "up" ? "📈 Rising" : v.trend === "down" ? "📉 Falling" : "➡️ Stable",
          v.unit,
        ]),
        ["", "", "", "", ""],
        ["=== YOUR HERD VALUATION ===", "", "", "", ""],
        ["Tag", "Stage", "Weight (kg)", "Market Value (RWF)", "Status"],
        ...active.map(p => [p.tag, p.stage, p.weight, getMarketPrice(p.stage, p.weight), "Active"]),
        ["", "Total Herd Value", "", active.reduce((s, p) => s + getMarketPrice(p.stage, p.weight), 0), ""],
        ["", "", "", "", ""],
        ["=== FINANCIAL SUMMARY ===", "", "", "", ""],
        ["Item", "Amount (RWF)", "", "", ""],
        ["Total Income", sales.reduce((s, l) => s + (l.total || 0), 0) + incomes.reduce((s, l) => s + (l.amount || 0), 0), "", "", ""],
        ["Total Expenses", feeds.reduce((s, l) => s + (l.cost || 0), 0) + expenses.reduce((s, l) => s + (l.amount || 0), 0), "", "", ""],
        ["Net Profit", (sales.reduce((s, l) => s + (l.total || 0), 0) + incomes.reduce((s, l) => s + (l.amount || 0), 0)) - (feeds.reduce((s, l) => s + (l.cost || 0), 0) + expenses.reduce((s, l) => s + (l.amount || 0), 0)), "", "", ""],
        ["Herd Market Value", active.reduce((s, p) => s + getMarketPrice(p.stage, p.weight), 0), "", "", ""],
        ["", "", "", "", ""],
        ["=== RWANDA MARKETS ===", "", "", "", ""],
        ...MARKETS.map(m => [m, "", "", "", ""]),
      ];
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `FarmIQ_Market_Report_${toDay()}.csv`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (e) { alert("Export error: " + e.message); }
    setExporting(false);
  }

  const totalInc = sales.reduce((s, l) => s + (l.total || 0), 0) + incomes.reduce((s, l) => s + (l.amount || 0), 0);
  const totalExp = feeds.reduce((s, l) => s + (l.cost || 0), 0) + expenses.reduce((s, l) => s + (l.amount || 0), 0);
  const herdVal = active.reduce((s, p) => s + getMarketPrice(p.stage, p.weight), 0);
  const ready80 = active.filter(p => p.weight >= 80);

  return (
    <div className="fade-in" style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>📈 Rwanda Pig Market</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Live prices · Weather · Alerts · Export</div>
          {(() => {
            try {
              const sv = JSON.parse(localStorage.getItem("farmiq_market_surveys") || "[]");
              if (sv.length > 0) {
                const l = sv.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
                return <div style={{ fontSize: 11, color: C.accent, marginTop: 3 }}>✅ Using field survey prices from {l.date} · {l.market}</div>;
              }
              return <div style={{ fontSize: 11, color: C.amber, marginTop: 3 }}>⚠️ Using estimated prices — add a Market Survey for accuracy</div>;
            } catch (e) { return null; }
          })()}
        </div>
        <button onClick={exportExcel} disabled={exporting} style={{
          padding: "9px 18px", borderRadius: 9, border: "none", cursor: "pointer",
          background: "linear-gradient(135deg,#16a34a,#15803d)",
          color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "inherit",
          boxShadow: "0 2px 8px rgba(22,163,74,.3)", display: "flex", alignItems: "center", gap: 7,
        }}>
          {exporting ? "⏳ Exporting..." : "📥 Export to Excel"}
        </button>
      </div>

      {/* Today's Alerts */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>🔔 Today's Farm Alerts</div>
        {notifs.map((n, i) => (
          <div key={i} style={{ padding: "10px 14px", borderRadius: 9, marginBottom: 7, fontSize: 13, fontWeight: 500, background: n.color + "18", border: "1.5px solid " + n.color + "44", color: n.color }}>
            {n.msg}
          </div>
        ))}
      </div>

      {/* Kigali Weather */}
      <div style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 18, border: "1px solid " + C.border }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>🌤️ Kigali Weather (Live)</div>
        {weather ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 36 }}>{weather.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{weather.temp}°C</div>
              <div style={{ fontSize: 12, color: C.muted }}>{weather.desc} · Feels like {weather.feels}°C</div>
            </div>
            {[["💧 Humidity", weather.humidity + "%"], ["🌬️ Wind", weather.wind + " km/h"]].map(([l, v]) => (
              <div key={l} style={{ background: C.elevated, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.muted }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 2 }}>{v}</div>
              </div>
            ))}
            <div style={{ fontSize: 11, color: C.faint, marginLeft: "auto" }}>
              ⚠️ Hot &gt;30°C = stress risk<br />🌧️ Heavy rain = disease risk
            </div>
          </div>
        ) : weatherErr ? (
          <div style={{ color: C.muted, fontSize: 13 }}>⚠️ Weather unavailable — check internet connection</div>
        ) : (
          <div style={{ color: C.muted, fontSize: 13 }}>⏳ Loading weather...</div>
        )}
      </div>

      {/* Market Prices */}
      <div style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 18, border: "1px solid " + C.border }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>💰 Today's Rwanda Market Prices</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
          {Object.entries(RW_BASE_PRICES).map(([k, v]) => {
            const price = Math.round(v.base * getDailyVariance());
            return (
              <div key={k} style={{ background: C.elevated, borderRadius: 10, padding: "10px 12px", border: "1px solid " + C.border }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{v.desc}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{fmtRWF(price)}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>per {v.unit}</div>
                <div style={{ fontSize: 10, marginTop: 4, color: v.trend === "up" ? "#16a34a" : v.trend === "down" ? "#dc2626" : C.muted }}>
                  {v.trend === "up" ? "📈 Rising" : v.trend === "down" ? "📉 Falling" : "➡️ Stable"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Herd Valuation Table */}
      <div style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 18, border: "1px solid " + C.border }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>🐷 Your Herd Valuation</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>Total: {fmtRWF(herdVal)}</div>
        </div>
        {ready80.length > 0 && (
          <div style={{ background: "#16a34a18", border: "1px solid #16a34a44", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
            🏷️ {ready80.length} pig{ready80.length > 1 ? "s" : ""} ready to sell now (80kg+) — potential: {fmtRWF(ready80.reduce((s, p) => s + getMarketPrice(p.stage, p.weight), 0))}
          </div>
        )}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid " + C.border }}>
                {["Tag", "Stage", "Weight", "Market Value", "Ready?"].map(h => (
                  <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: C.muted, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {active.slice().sort((a, b) => getMarketPrice(b.stage, b.weight) - getMarketPrice(a.stage, a.weight)).map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid " + C.border + "66" }}>
                  <td style={{ padding: "7px 10px", fontWeight: 700, color: C.text }}>{p.tag}</td>
                  <td style={{ padding: "7px 10px", color: C.muted }}>{p.stage}</td>
                  <td style={{ padding: "7px 10px", color: C.muted }}>{p.weight}kg</td>
                  <td style={{ padding: "7px 10px", fontWeight: 700, color: C.accent }}>{fmtRWF(getMarketPrice(p.stage, p.weight))}</td>
                  <td style={{ padding: "7px 10px" }}>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: p.weight >= 80 ? "#16a34a22" : "#f59e0b22", color: p.weight >= 80 ? "#16a34a" : "#d97706", fontWeight: 600 }}>
                      {p.weight >= 80 ? "✅ Sell Now" : "⏳ Growing"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rwanda Livestock Markets */}
      <div style={{ background: C.card, borderRadius: 14, padding: 16, marginBottom: 18, border: "1px solid " + C.border }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 10 }}>📍 Rwanda Livestock Markets</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MARKETS.map(m => (
            <div key={m} style={{ background: C.elevated, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: C.text, border: "1px solid " + C.border }}>
              📍 {m}
            </div>
          ))}
        </div>
      </div>

      {/* AI Market Strategy */}
      <AIPrediction
        pigs={pigs} feeds={feeds} sales={sales} logs={logs}
        expenses={expenses} incomes={incomes} reproductions={reproductions} stock={stock}
        topic={`Rwanda pig market advisor. Herd value=${fmtRWF(herdVal)}, ready to sell=${ready80.length} pigs, profit=${fmtRWF(calcPnL(capital || { transactions: [] }, feeds, sales, expenses, incomes).profit)}. Give: 1) best time to sell now, 2) which pigs to sell first, 3) price negotiation tips for Rwanda markets, 4) seasonal price trends, 5) how to get best price at ${MARKETS[0]}.`}
        label="🤖 AI Market Strategy" icon="📈"
      />
    </div>
  );
}

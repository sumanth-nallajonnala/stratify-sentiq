import { useState } from "react";
import axios from "axios";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";

const API_URL = "http://127.0.0.1:8000";

// ── Color palette ──────────────────────────────────────────────────────────
const COLORS = {
  fit:     "#E74C3C",
  comfort: "#E67E22",
  quality: "#2ECC71",
  style:   "#3498DB",
  value:   "#9B59B6",
};

const DIM_LABELS = {
  fit: "Fit", comfort: "Comfort",
  quality: "Quality", style: "Style", value: "Value"
};

// ── Score color helper ─────────────────────────────────────────────────────
function scoreColor(score) {
  if (!score) return "#95A5A6";
  if (score >= 4.0) return "#2ECC71";
  if (score >= 3.0) return "#F39C12";
  return "#E74C3C";
}

// ── Score bar component ────────────────────────────────────────────────────
function ScoreBar({ label, score, color }) {
  const pct = score ? (score / 5) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#ECF0F1", fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span style={{ color: scoreColor(score), fontSize: 13, fontWeight: 700 }}>
          {score ? `${score}/5.0` : "N/A"}
        </span>
      </div>
      <div style={{ background: "#2C3E50", borderRadius: 6, height: 10, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: color, borderRadius: 6,
          transition: "width 0.8s ease"
        }} />
      </div>
    </div>
  );
}

// ── Scorecard component ────────────────────────────────────────────────────
function Scorecard({ data, isSelected, onClick }) {
  const dims = ["fit", "comfort", "quality", "style", "value"];
  const radarData = dims.map(d => ({
    dim: DIM_LABELS[d],
    score: data[d] || 0,
    fullMark: 5
  }));

  return (
    <div onClick={onClick} style={{
      background: isSelected ? "#1A2980" : "#1E2A3A",
      border: `2px solid ${isSelected ? "#3498DB" : "#2C3E50"}`,
      borderRadius: 12, padding: 20, cursor: "pointer",
      transition: "all 0.3s ease",
      boxShadow: isSelected ? "0 0 20px rgba(52,152,219,0.3)" : "none"
    }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ color: "#ECF0F1", margin: 0, fontSize: 15, fontWeight: 700 }}>
          {data.product_name}
        </h3>
        <p style={{ color: "#7F8C8D", margin: "4px 0 0", fontSize: 12 }}>
          {data.total_reviews} reviews analyzed
        </p>
      </div>

      {/* Overall badge */}
      <div style={{
        display: "inline-block", background: "#0D1B2A",
        borderRadius: 8, padding: "6px 14px", marginBottom: 16
      }}>
        <span style={{ color: "#7F8C8D", fontSize: 11 }}>Overall SentIQ Score  </span>
        <span style={{
          color: scoreColor(data.overall_avg),
          fontSize: 18, fontWeight: 800
        }}>
          {data.overall_avg || "N/A"}
        </span>
        <span style={{ color: "#7F8C8D", fontSize: 11 }}> /5.0</span>
      </div>

      {/* Score bars */}
      {dims.map(d => (
        <ScoreBar key={d} label={DIM_LABELS[d]} score={data[d]} color={COLORS[d]} />
      ))}

      {/* Radar chart */}
      <div style={{ height: 180, marginTop: 12 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#2C3E50" />
            <PolarAngleAxis dataKey="dim" tick={{ fill: "#7F8C8D", fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
            <Radar dataKey="score" stroke="#3498DB" fill="#3498DB" fillOpacity={0.3} />
            <Tooltip
              contentStyle={{ background: "#0D1B2A", border: "1px solid #2C3E50", borderRadius: 8 }}
              labelStyle={{ color: "#ECF0F1" }}
              formatter={(v) => [`${v}/5.0`]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendation */}
      <div style={{
        background: "#0D1B2A", borderRadius: 8,
        padding: 12, marginTop: 12,
        borderLeft: "3px solid #F39C12"
      }}>
        <p style={{ color: "#F39C12", fontSize: 11, fontWeight: 700, margin: "0 0 4px" }}>
          💡 TOP RECOMMENDATION
        </p>
        <p style={{ color: "#BDC3C7", fontSize: 11, margin: 0, lineHeight: 1.5 }}>
          {data.top_recommendation}
        </p>
      </div>
    </div>
  );
}

// ── Metrics panel ──────────────────────────────────────────────────────────
function MetricsPanel({ metrics }) {
  if (!metrics) return null;
  return (
    <div style={{
      background: "#1E2A3A", borderRadius: 12,
      padding: 20, marginBottom: 24,
      border: "1px solid #2C3E50"
    }}>
      <h3 style={{ color: "#ECF0F1", margin: "0 0 16px", fontSize: 15 }}>
        📊 Cost & Performance Metrics
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { label: "Reviews Analyzed", value: metrics.total_reviews_analyzed?.toLocaleString(), color: "#3498DB" },
          { label: "Total Cost (USD)", value: `$${metrics.total_infrastructure_cost_usd}`, color: "#2ECC71" },
          { label: "Cost per Review", value: `$${metrics.avg_cost_per_review_usd}`, color: "#F39C12" },
          { label: "ML Model", value: "Open-Source", color: "#9B59B6" },
        ].map((m, i) => (
          <div key={i} style={{
            background: "#0D1B2A", borderRadius: 8,
            padding: 14, textAlign: "center"
          }}>
            <p style={{ color: m.color, fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>
              {m.value}
            </p>
            <p style={{ color: "#7F8C8D", fontSize: 11, margin: 0 }}>{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Comparison bar chart ───────────────────────────────────────────────────
function ComparisonChart({ scorecards }) {
  if (!scorecards || scorecards.length < 2) return null;
  const data = scorecards.map(s => ({
    name: `ID ${s.product_id}`,
    Fit: s.fit, Comfort: s.comfort,
    Quality: s.quality, Style: s.style, Value: s.value
  }));

  return (
    <div style={{
      background: "#1E2A3A", borderRadius: 12,
      padding: 20, marginBottom: 24,
      border: "1px solid #2C3E50"
    }}>
      <h3 style={{ color: "#ECF0F1", margin: "0 0 16px", fontSize: 15 }}>
        📈 Product Comparison — All Dimensions
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2C3E50" />
          <XAxis dataKey="name" tick={{ fill: "#7F8C8D", fontSize: 11 }} />
          <YAxis domain={[0, 5]} tick={{ fill: "#7F8C8D", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#0D1B2A", border: "1px solid #2C3E50", borderRadius: 8 }}
            labelStyle={{ color: "#ECF0F1" }}
          />
          <Legend wrapperStyle={{ color: "#7F8C8D", fontSize: 11 }} />
          {Object.entries(COLORS).map(([key, color]) => (
            <Bar key={key} dataKey={DIM_LABELS[key]} fill={color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [file, setFile]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [metrics, setMetrics]     = useState(null);
  const [error, setError]         = useState(null);
  const [selected, setSelected]   = useState(0);
  const [dragOver, setDragOver]   = useState(false);

  async function handleAnalyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_URL}/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(res.data);

      // Also fetch metrics
      const mRes = await axios.get(`${API_URL}/metrics`);
      setMetrics(mRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Analysis failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".csv")) setFile(dropped);
    else setError("Please upload a CSV file.");
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0D1B2A",
      fontFamily: "'Segoe UI', sans-serif", color: "#ECF0F1"
    }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        background: "#0A1628", padding: "0 32px",
        height: 60, display: "flex", alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #1E2A3A",
        position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            background: "linear-gradient(135deg, #3498DB, #9B59B6)",
            borderRadius: 8, width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14, color: "white"
          }}>S</div>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#ECF0F1" }}>
            Sent<span style={{ color: "#3498DB" }}>IQ</span>
          </span>
          <span style={{
            background: "#1E2A3A", color: "#7F8C8D",
            fontSize: 10, padding: "2px 8px", borderRadius: 10
          }}>v1.0 — Team Stratify</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <span style={{ color: "#2ECC71", fontSize: 12 }}>● API Connected</span>
          <span style={{ color: "#7F8C8D", fontSize: 12 }}>DAKSH '26</span>
        </div>
      </nav>

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{
            fontSize: 36, fontWeight: 800, margin: "0 0 12px",
            background: "linear-gradient(135deg, #ECF0F1, #3498DB)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>
            Multi-Dimensional Customer Intelligence
          </h1>
          <p style={{ color: "#7F8C8D", fontSize: 15, margin: 0 }}>
            Upload your product reviews CSV and get a 5-dimension scorecard instantly.
            <br />
            <span style={{ color: "#F39C12" }}>
              Fit · Comfort · Quality · Style · Value
            </span>
          </p>
        </div>

        {/* ── UPLOAD ZONE ── */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragOver ? "#3498DB" : file ? "#2ECC71" : "#2C3E50"}`,
            borderRadius: 16, padding: "40px 20px",
            textAlign: "center", marginBottom: 24,
            background: dragOver ? "#1A2980" : "#1E2A3A",
            transition: "all 0.3s ease", cursor: "pointer"
          }}
          onClick={() => document.getElementById("fileInput").click()}
        >
          <input
            id="fileInput" type="file" accept=".csv"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files[0])}
          />
          <div style={{ fontSize: 40, marginBottom: 12 }}>
            {file ? "✅" : "📂"}
          </div>
          {file ? (
            <>
              <p style={{ color: "#2ECC71", fontWeight: 700, margin: "0 0 4px" }}>
                {file.name}
              </p>
              <p style={{ color: "#7F8C8D", fontSize: 12, margin: 0 }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB · Click to change
              </p>
            </>
          ) : (
            <>
              <p style={{ color: "#ECF0F1", fontWeight: 600, margin: "0 0 4px" }}>
                Drag & drop your reviews CSV here
              </p>
              <p style={{ color: "#7F8C8D", fontSize: 12, margin: 0 }}>
                or click to browse · Must contain "Review Text" and "Clothing ID" columns
              </p>
            </>
          )}
        </div>

        {/* Analyze button */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <button
            onClick={handleAnalyze}
            disabled={!file || loading}
            style={{
              background: !file || loading
                ? "#2C3E50"
                : "linear-gradient(135deg, #3498DB, #1A5276)",
              color: !file || loading ? "#7F8C8D" : "white",
              border: "none", borderRadius: 12,
              padding: "14px 48px", fontSize: 15,
              fontWeight: 700, cursor: !file || loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: !file || loading ? "none" : "0 4px 20px rgba(52,152,219,0.4)"
            }}
          >
            {loading ? "⏳ Analyzing Reviews..." : "🚀 Analyze with SentIQ"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#2C0B0E", border: "1px solid #E74C3C",
            borderRadius: 12, padding: 16, marginBottom: 24,
            color: "#E74C3C", textAlign: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{
            background: "#1E2A3A", borderRadius: 12,
            padding: 32, textAlign: "center", marginBottom: 24
          }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🧠</div>
            <p style={{ color: "#3498DB", fontWeight: 700, fontSize: 16, margin: "0 0 8px" }}>
              SentIQ is analyzing your reviews...
            </p>
            <p style={{ color: "#7F8C8D", fontSize: 13, margin: 0 }}>
              Running multi-dimensional NLP scoring across Fit, Comfort, Quality, Style & Value.
              <br />This may take 1–2 minutes depending on review volume.
            </p>
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && (
          <>
            {/* Summary banner */}
            <div style={{
              background: "linear-gradient(135deg, #1A5276, #0D1B2A)",
              borderRadius: 12, padding: "16px 24px",
              marginBottom: 24, display: "flex",
              justifyContent: "space-between", alignItems: "center",
              border: "1px solid #2E86C1"
            }}>
              <div>
                <p style={{ color: "#7F8C8D", fontSize: 12, margin: "0 0 2px" }}>Analysis Complete</p>
                <p style={{ color: "#ECF0F1", fontWeight: 700, fontSize: 16, margin: 0 }}>
                  {result.total_products} products · {result.scorecards.reduce((a, s) => a + s.total_reviews, 0).toLocaleString()} reviews analyzed
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#7F8C8D", fontSize: 12, margin: "0 0 2px" }}>Total Cost</p>
                <p style={{ color: "#2ECC71", fontWeight: 800, fontSize: 18, margin: 0 }}>
                  ${result.cost_metrics.total_cost_usd}
                </p>
              </div>
            </div>

            {/* Metrics panel */}
            <MetricsPanel metrics={metrics} />

            {/* Comparison chart */}
            <ComparisonChart scorecards={result.scorecards} />

            {/* Scorecards grid */}
            <h3 style={{ color: "#ECF0F1", marginBottom: 16, fontSize: 15 }}>
              🎯 Product Scorecards — Click any card for details
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 20
            }}>
              {result.scorecards.map((s, i) => (
                <Scorecard
                  key={s.product_id}
                  data={s}
                  isSelected={selected === i}
                  onClick={() => setSelected(i)}
                />
              ))}
            </div>

            {/* Job ID footer */}
            <div style={{
              marginTop: 32, textAlign: "center",
              color: "#2C3E50", fontSize: 11
            }}>
              Job ID: {result.job_id} · Analyzed at {new Date(result.analyzed_at).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
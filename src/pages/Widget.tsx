import { useState, useCallback } from "react";
import { Sparkles, X, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { streamAnalysis } from "@/lib/streaming";

const MODES = [
  { value: "architecture", label: "Architecture" },
  { value: "security", label: "Security" },
  { value: "debugging", label: "Debugging" },
  { value: "performance", label: "Performance" },
  { value: "best_practices", label: "Best Practices" },
  { value: "refactoring", label: "Refactoring" },
  { value: "test_generation", label: "Test Gen" },
] as const;

export default function Widget() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("architecture");
  const [collapsed, setCollapsed] = useState(false);

  const handleAnalyze = useCallback(async () => {
    if (!code.trim() || isLoading) return;
    setOutput("");
    setIsLoading(true);

    try {
      await streamAnalysis({
        code,
        mode,
        onDelta: (text) => setOutput((prev) => prev + text),
        onDone: () => setIsLoading(false),
        onError: (error) => {
          setOutput(`Error: ${error}`);
          setIsLoading(false);
        },
      });
    } catch {
      setOutput("Failed to connect to analysis service.");
      setIsLoading(false);
    }
  }, [code, mode, isLoading]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCode(text);
    } catch { /* clipboard API may not be available */ }
  };

  const handleCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
    } catch { /* ignore */ }
  };

  // Minimal self-contained dark UI for popup/bookmarklet use
  return (
    <div style={{
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      background: "#0a0a0f",
      color: "#e4e4e7",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        borderBottom: "1px solid #27272a",
        background: "#111116",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#fff",
          }}>⟨⟩</div>
          <span style={{ fontWeight: 600, fontSize: 14 }}>CodeLens AI</span>
          <span style={{
            fontSize: 10, background: "#27272a", padding: "2px 6px",
            borderRadius: 8, fontFamily: "monospace",
          }}>widget</span>
        </div>
        <button
          onClick={() => window.close()}
          style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", padding: 4 }}
          title="Close"
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 12, gap: 10, overflow: "auto" }}>
        {/* Mode selector */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                borderRadius: 6,
                border: mode === m.value ? "1px solid #6366f1" : "1px solid #27272a",
                background: mode === m.value ? "#6366f120" : "transparent",
                color: mode === m.value ? "#a5b4fc" : "#a1a1aa",
                cursor: "pointer",
                fontWeight: mode === m.value ? 600 : 400,
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Code input */}
        <div style={{ position: "relative" }}>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste code here..."
            style={{
              width: "100%",
              minHeight: collapsed ? 60 : 140,
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: 8,
              padding: "10px 12px",
              color: "#e4e4e7",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
            onBlur={(e) => (e.target.style.borderColor = "#27272a")}
          />
          <div style={{ position: "absolute", bottom: 6, right: 6, display: "flex", gap: 4 }}>
            <button
              onClick={handlePaste}
              style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 4,
                background: "#27272a", border: "none", color: "#a1a1aa", cursor: "pointer",
              }}
            >Paste</button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: 10, padding: "3px 6px", borderRadius: 4,
                background: "#27272a", border: "none", color: "#a1a1aa", cursor: "pointer",
                display: "flex", alignItems: "center",
              }}
            >
              {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          </div>
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !code.trim()}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 8,
            border: "none",
            background: isLoading || !code.trim()
              ? "#27272a"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: isLoading || !code.trim() ? "#52525b" : "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: isLoading || !code.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          {isLoading ? (
            <>
              <span style={{
                width: 14, height: 14, border: "2px solid #52525b",
                borderTop: "2px solid #a1a1aa", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={14} />
              Analyze
            </>
          )}
        </button>

        {/* Output */}
        {output && (
          <div style={{ position: "relative" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 6,
            }}>
              <span style={{ fontSize: 11, color: "#71717a", fontWeight: 500 }}>Result</span>
              <button
                onClick={handleCopyOutput}
                style={{
                  fontSize: 10, padding: "3px 8px", borderRadius: 4,
                  background: "#27272a", border: "none", color: "#a1a1aa",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 3,
                }}
              >
                <Copy size={10} /> Copy
              </button>
            </div>
            <div style={{
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              fontFamily: "'JetBrains Mono', monospace",
              maxHeight: 400,
              overflow: "auto",
              wordBreak: "break-word",
            }}>
              {output}
              {isLoading && (
                <span style={{
                  display: "inline-block", width: 6, height: 14,
                  background: "#6366f1", marginLeft: 2,
                  animation: "blink 1s step-end infinite",
                }} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer with bookmarklet instructions */}
      {!output && !isLoading && (
        <div style={{
          padding: "10px 16px",
          borderTop: "1px solid #27272a",
          fontSize: 10,
          color: "#52525b",
          textAlign: "center",
        }}>
          Drag the bookmarklet to your bookmarks bar to use on any page
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 50% { opacity: 0; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
      `}</style>
    </div>
  );
}

import { useState, useSyncExternalStore } from "react";
import { logger, type LogLevel, type LogEntry } from "../../lib/logger";

const levelColors = {
  debug: {
    bg: "bg-gray-500/20",
    border: "border-gray-500/50",
    text: "text-gray-400",
    dot: "bg-gray-400",
  },
  info: {
    bg: "bg-blue-500/20",
    border: "border-blue-500/50",
    text: "text-blue-300",
    dot: "bg-blue-400",
  },
  warn: {
    bg: "bg-amber-500/20",
    border: "border-amber-500/50",
    text: "text-amber-300",
    dot: "bg-amber-400",
  },
  error: {
    bg: "bg-red-500/20",
    border: "border-red-500/50",
    text: "text-red-300",
    dot: "bg-red-400",
  },
};

function LevelChip({
  level,
  active,
  onClick,
}: {
  level: LogLevel;
  active: boolean;
  onClick: () => void;
}) {
  const colors = levelColors[level];
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer ${
        active
          ? `${colors.bg} ${colors.border} border ${colors.text}`
          : "bg-white/8 border border-white/20 text-gray-500"
      }`}
    >
      {level}
    </button>
  );
}

function LogEntryRow({
  entry,
  expanded,
  onToggle,
}: {
  entry: LogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const colors = levelColors[entry.level];
  const hasData = entry.data != null && Object.keys(entry.data).length > 0;

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString();
    }
    return date.toLocaleString();
  };

  return (
    <div className="flex flex-col border-b border-white/10 last:border-0">
      <div
        onClick={hasData ? onToggle : undefined}
        className={`flex items-start gap-2.5 px-3 py-2.5 ${
          hasData ? "cursor-pointer hover:bg-white/5" : ""
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${colors.dot}`}
        />
        <div className="flex-1 min-w-0">
          <div className="text-white text-sm break-words">{entry.message}</div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-gray-500">{formatTimestamp(entry.ts)}</span>
            {entry.source && (
              <>
                <span className="text-gray-600">·</span>
                <span className="text-gray-500 font-mono">{entry.source}</span>
              </>
            )}
            {hasData && (
              <>
                <span className="text-gray-600">·</span>
                <span className="text-blue-400">{expanded ? "▼" : "▶"}</span>
              </>
            )}
          </div>
        </div>
      </div>
      {hasData && expanded && (
        <div className="px-3 pb-2.5 pl-7.5">
          <pre className="text-xs font-mono text-gray-300 bg-black/40 p-2 rounded overflow-auto max-h-64">
            {JSON.stringify(entry.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function LogsView(): JSX.Element {
  const entries = useSyncExternalStore(logger.subscribe, logger.getSnapshot);
  const [activeLevels, setActiveLevels] = useState<Set<LogLevel>>(
    new Set(["debug", "info", "warn", "error"]),
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [clearState, setClearState] = useState<"idle" | "confirm">("idle");

  const toggleLevel = (level: LogLevel) => {
    const next = new Set(activeLevels);
    if (next.has(level)) {
      next.delete(level);
    } else {
      next.add(level);
    }
    setActiveLevels(next);
  };

  const toggleExpanded = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  const handleClear = () => {
    logger.clear();
    setExpandedIds(new Set());
    setClearState("idle");
  };

  const filteredEntries = entries.filter((e) => activeLevels.has(e.level));

  return (
    <div className="flex flex-col gap-3">
      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["debug", "info", "warn", "error"] as LogLevel[]).map((level) => (
          <LevelChip
            key={level}
            level={level}
            active={activeLevels.has(level)}
            onClick={() => toggleLevel(level)}
          />
        ))}
      </div>

      {/* Logs list */}
      {filteredEntries.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
          {entries.length === 0
            ? "No logs yet."
            : "No logs match the selected levels."}
        </div>
      ) : (
        <div className="bg-white/8 rounded-lg overflow-hidden border border-white/10">
          {filteredEntries.map((entry) => (
            <LogEntryRow
              key={entry.id}
              entry={entry}
              expanded={expandedIds.has(entry.id)}
              onToggle={() => toggleExpanded(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Clear button */}
      {clearState === "idle" && (
        <button
          onClick={() => setClearState("confirm")}
          disabled={entries.length === 0}
          className={`flex items-center justify-center gap-2 px-3.5 py-3 rounded-lg text-sm font-bold text-white w-full transition-colors duration-150 ${
            entries.length === 0
              ? "bg-white/8 border border-white/20 cursor-not-allowed opacity-50"
              : "bg-red-500/20 border border-red-500/50 cursor-pointer hover:bg-red-500/30"
          }`}
        >
          Clear logs
        </button>
      )}

      {clearState === "confirm" && (
        <div className="flex flex-col gap-2 px-3.5 py-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <div className="text-red-300 text-xs font-semibold">
            Clear all logs? This cannot be undone.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setClearState("idle")}
              className="flex-1 px-3 py-2.5 rounded-lg text-xs font-bold text-white bg-white/10 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleClear}
              className="flex-1 px-3 py-2.5 rounded-lg text-xs font-bold text-white bg-red-500/30 border border-red-500/60 cursor-pointer hover:bg-red-500/40 transition-colors duration-150"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

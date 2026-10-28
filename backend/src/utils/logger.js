const formatTimestamp = () => new Date().toISOString();

function log(level, message, meta = {}) {
  const entry = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...meta,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(entry));
    return;
  }

  console.log(JSON.stringify(entry));
}

export const logger = {
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta),
};

function normalizeEntryPath(entryPath) {
  return String(entryPath)
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/^\/+/, '');
}

export function hasTopLevelDirectoryEntry(entryPath, directoryName) {
  const normalizedEntry = normalizeEntryPath(entryPath);
  return normalizedEntry === directoryName || normalizedEntry.startsWith(`${directoryName}/`);
}

export function findTopLevelDirectoryMatches(entries, directoryNames) {
  const normalizedEntries = entries.map((entry) => normalizeEntryPath(entry));
  return directoryNames.filter((directoryName) =>
    normalizedEntries.some((entry) => hasTopLevelDirectoryEntry(entry, directoryName))
  );
}

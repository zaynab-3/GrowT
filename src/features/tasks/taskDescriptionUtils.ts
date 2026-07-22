export function normalizeChecklistItems(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean)
}

export function getInitialChecklistItems(items: string[]) {
  const normalizedItems = normalizeChecklistItems(items)
  return normalizedItems.length ? normalizedItems : ['']
}

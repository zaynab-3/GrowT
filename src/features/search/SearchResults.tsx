type SearchResultsProps = {
  totalCount: number
  visibleCount: number
  hasQuery: boolean
}

export function SearchResults({ hasQuery, totalCount, visibleCount }: SearchResultsProps) {
  return <span>{hasQuery ? `${visibleCount}/${totalCount}` : totalCount}</span>
}

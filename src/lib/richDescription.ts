export const descriptionBlockPattern = /^(#{1,3}\s|[-+*]\s|\d+\.\s|>\s)/

export function getDescriptionPresentation(text: string) {
  const lines = text.replace(/\r\n?/g, '\n').trim().split('\n')
  const nonEmptyLines = lines.filter((line) => line.trim())
  const hasBlankLine = lines.some((line) => !line.trim())
  const hasBlockMarkup = nonEmptyLines.some((line) => descriptionBlockPattern.test(line))

  return {
    count: nonEmptyLines.length,
    kind: nonEmptyLines.length > 1 && !hasBlankLine && !hasBlockMarkup
      ? 'notes' as const
      : 'document' as const,
  }
}

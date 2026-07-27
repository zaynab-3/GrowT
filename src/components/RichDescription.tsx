import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { descriptionBlockPattern, getDescriptionPresentation } from '../lib/richDescription'
import './RichDescription.css'

type RichDescriptionProps = {
  className?: string
  collapsedNoteCount?: number
  text: string
}

const inlinePattern =
  /(\[[^\]]+\]\(https?:\/\/[^\s)]+\)|\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|https?:\/\/[^\s<]+)/g

function inlineContent(value: string, keyPrefix = 'inline'): ReactNode[] {
  const nodes: ReactNode[] = []
  let cursor = 0
  let match: RegExpExecArray | null
  let index = 0

  inlinePattern.lastIndex = 0

  while ((match = inlinePattern.exec(value)) !== null) {
    if (match.index > cursor) {
      nodes.push(value.slice(cursor, match.index))
    }

    const token = match[0]
    const key = `${keyPrefix}-${index}`

    if (token.startsWith('[')) {
      const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
      if (linkMatch) {
        nodes.push(
          <a href={linkMatch[2]} key={key} rel="noreferrer" target="_blank">
            {linkMatch[1]}
          </a>,
        )
      }
    } else if (
      (token.startsWith('**') && token.endsWith('**')) ||
      (token.startsWith('__') && token.endsWith('__'))
    ) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    } else if (
      (token.startsWith('*') && token.endsWith('*')) ||
      (token.startsWith('_') && token.endsWith('_'))
    ) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>)
    } else if (token.startsWith('`') && token.endsWith('`')) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>)
    } else {
      nodes.push(
        <a href={token} key={key} rel="noreferrer" target="_blank">
          {token}
        </a>,
      )
    }

    cursor = match.index + token.length
    index += 1
  }

  if (cursor < value.length) {
    nodes.push(value.slice(cursor))
  }

  return nodes
}

function linesWithBreaks(lines: string[], keyPrefix: string) {
  return lines.map((line, index) => (
    <Fragment key={`${keyPrefix}-${index}`}>
      {index > 0 ? <br /> : null}
      {inlineContent(line, `${keyPrefix}-${index}`)}
    </Fragment>
  ))
}

function MarkdownBlocks({ lines }: { lines: string[] }) {
  const blocks: ReactNode[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (!line.trim()) {
      index += 1
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      const Heading = `h${Math.min(heading[1].length + 2, 5)}` as 'h3' | 'h4' | 'h5'
      blocks.push(<Heading key={`heading-${index}`}>{inlineContent(heading[2], `heading-${index}`)}</Heading>)
      index += 1
      continue
    }

    if (/^[-+*]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[-+*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-+*]\s+/, ''))
        index += 1
      }
      blocks.push(
        <ul key={`ul-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`ul-${index}-${itemIndex}`}>{inlineContent(item, `ul-${index}-${itemIndex}`)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ''))
        index += 1
      }
      blocks.push(
        <ol key={`ol-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={`ol-${index}-${itemIndex}`}>{inlineContent(item, `ol-${index}-${itemIndex}`)}</li>
          ))}
        </ol>,
      )
      continue
    }

    if (/^>\s+/.test(line)) {
      const quoteLines: string[] = []
      while (index < lines.length && /^>\s+/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s+/, ''))
        index += 1
      }
      blocks.push(
        <blockquote key={`quote-${index}`}>
          {linesWithBreaks(quoteLines, `quote-${index}`)}
        </blockquote>,
      )
      continue
    }

    const paragraphLines: string[] = []
    while (index < lines.length && lines[index].trim() && !descriptionBlockPattern.test(lines[index])) {
      paragraphLines.push(lines[index])
      index += 1
    }
    blocks.push(
      <p key={`paragraph-${index}`}>
        {linesWithBreaks(paragraphLines, `paragraph-${index}`)}
      </p>,
    )
  }

  return <>{blocks}</>
}

export function RichDescription({
  className = '',
  collapsedNoteCount = 5,
  text,
}: RichDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const normalized = useMemo(() => text.replace(/\r\n?/g, '\n').trim(), [text])
  const lines = useMemo(() => normalized.split('\n'), [normalized])
  const nonEmptyLines = useMemo(() => lines.filter((line) => line.trim()), [lines])
  const presentation = useMemo(() => getDescriptionPresentation(normalized), [normalized])
  const isNoteStream = presentation.kind === 'notes'
  const visibleNotes = isExpanded ? nonEmptyLines : nonEmptyLines.slice(0, collapsedNoteCount)
  const hiddenNoteCount = Math.max(nonEmptyLines.length - visibleNotes.length, 0)

  if (!normalized) {
    return null
  }

  if (isNoteStream) {
    return (
      <div className={`rich-description rich-description--notes ${className}`.trim()}>
        <ol className="rich-description__notes">
          {visibleNotes.map((line, index) => (
            <li key={`note-${index}`}>
              <span>{inlineContent(line, `note-${index}`)}</span>
            </li>
          ))}
        </ol>
        {nonEmptyLines.length > collapsedNoteCount ? (
          <button
            className="rich-description__toggle"
            onClick={() => setIsExpanded((current) => !current)}
            type="button"
          >
            {isExpanded ? 'Show fewer notes' : `Show ${hiddenNoteCount} more`}
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`rich-description rich-description--document ${className}`.trim()}>
      <MarkdownBlocks lines={lines} />
    </div>
  )
}

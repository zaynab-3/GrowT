import { useMemo } from 'react'

const URL_REGEX = /((?:https?:\/\/|www\.)[^\s]+|\b[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b(?:\/[^\s]*)?)/g

export function LinkifiedText({ text }: { text: string }) {
  const elements = useMemo(() => {
    return text.split(URL_REGEX).map((part, index) => {
      if (part && part.match(URL_REGEX)) {
        let href = part;
        if (!/^https?:\/\//i.test(href)) {
          href = 'https://' + href;
        }
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        )
      }
      return part ? <span key={index}>{part}</span> : null
    })
  }, [text])

  return <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{elements}</span>
}

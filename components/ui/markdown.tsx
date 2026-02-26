"use client"

import { marked } from "marked"
import { useMemo } from "react"

// The AI often wraps content in ```markdown...``` fences — unwrap them so
// marked doesn't render the content as a code block.
function stripFence(content: string): string {
  return content.replace(/```(?:markdown|md)\n([\s\S]*?)```/g, "$1")
}

export function Markdown({ content }: { content: string }) {
  const html = useMemo(() => {
    return marked.parse(stripFence(content), { async: false }) as string
  }, [content])

  return (
    <div
      className="md-prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

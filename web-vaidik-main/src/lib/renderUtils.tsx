import React from 'react';
import type { JSX } from 'react';

/**
 * A utility to parse text and convert URLs (specifically Markdown links) into clickable anchor tags.
 * Supports: [text](url) and plain https://url
 */
export const renderMessageContent = (content: string) => {
  if (!content) return null;

  // Split by simple lines to handle basic line breaks
  const lines = content.split('\n');
  const renderedElements: JSX.Element[] = [];

  lines.forEach((line, index) => {
    // We treat every line as a simple paragraph to preserve the raw look
    // and keep all Markdown symbols (#, *, etc.) visible as requested.
    renderedElements.push(
      <div key={`line-${index}`} className="mb-1 leading-relaxed text-gray-800 text-sm md:text-base">
        {renderInlineFormatting(line)}
      </div>
    );
  });

  return renderedElements;
};

/**
 * Internal helper to handle inline formatting: **bold**, [links], and plain URLs.
 */
const renderInlineFormatting = (text: string) => {
  if (!text) return null;

  const parts: (string | JSX.Element)[] = [];

  // Combined regex for:
  // 1. **bold**
  // 2. [text](url)
  // 3. URLs
  const combinedRegex = /(\*\*.*?\*\*|\[.*?\]\(https?:\/\/[^\s)]+\)|https?:\/\/[^\s]+|vaidiktalk\.store)/g;

  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchText = match[0];

    // Handle Bold - keep ** symbols visible as requested
    if (matchText.startsWith('**') && matchText.endsWith('**')) {
      parts.push(
        <strong key={`bold-${match.index}`} className="font-bold text-gray-950">
          {matchText}
        </strong>
      );
    }
    // Handle Markdown Link
    else if (matchText.startsWith('[') && matchText.includes('](')) {
      const linkMatch = /\[(.*?)\]\((.*?)\)/.exec(matchText);
      if (linkMatch) {
        const [_, linkText, url] = linkMatch;
        parts.push(
          <a
            key={`link-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 underline font-bold transition-colors decoration-2 underline-offset-2"
          >
            {linkText}
          </a>
        );
      }
    }
    // Handle Plain URL
    else {
      const href = matchText.startsWith('http') ? matchText : `https://${matchText}`;
      parts.push(
        <a
          key={`plain-${match.index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 underline font-bold transition-colors decoration-2 underline-offset-2"
        >
          {matchText}
        </a>
      );
    }

    lastIndex = combinedRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
  * Renders inline markdown elements such as bold (**text**), italic (*text*),
  * inline code (`code`), and hex color codes (#HEX) with live color swatch pills.
  */
function renderInlineText(text: string): React.ReactNode[] {
  // Regex pattern matching hex color codes (#FFF, #FFFFFF, #FFFFFFFF)
  const hexPattern = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

  // Split and handle bold, italic, code, and hex swatches
  // We process in steps for simplicity and safety

  // Helper to process text tokens for inline code & bold/italic
  const processFormattedText = (raw: string, keyPrefix: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    // Match **bold**, *italic*, or `code`
    const parts = raw.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    parts.forEach((part, idx) => {
      const key = `${keyPrefix}-${idx}`;
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        nodes.push(
          <strong key={key} className="font-bold text-white">
            {renderInlineText(part.slice(2, -2))}
          </strong>
        );
      } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        nodes.push(
          <em key={key} className="italic text-cyan-200">
            {renderInlineText(part.slice(1, -1))}
          </em>
        );
      } else if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        nodes.push(
          <code
            key={key}
            className="px-1.5 py-0.5 rounded bg-[#1A1F2C] text-[#06B6D4] font-mono text-xs border border-white/[0.08]"
          >
            {part.slice(1, -1)}
          </code>
        );
      } else if (part) {
        // Check for hex color codes inside plain text
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = hexPattern.exec(part)) !== null) {
          const hexMatch = match[0];
          const matchIndex = match.index;

          if (matchIndex > lastIndex) {
            nodes.push(part.substring(lastIndex, matchIndex));
          }

          nodes.push(
            <span
              key={`${key}-hex-${matchIndex}`}
              className="inline-flex items-center gap-1.5 font-mono font-medium text-xs px-2 py-0.5 rounded-md bg-[#1E2433] border border-white/[0.12] align-middle my-0.5 shadow-sm text-white"
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-inner inline-block shrink-0"
                style={{ backgroundColor: hexMatch }}
              />
              <span>{hexMatch.toUpperCase()}</span>
            </span>
          );

          lastIndex = matchIndex + hexMatch.length;
        }

        if (lastIndex < part.length) {
          nodes.push(part.substring(lastIndex));
        }
      }
    });

    return nodes;
  };

  return processFormattedText(text, 'inline');
}

/**
  * Parses a block of markdown table lines into header cells and data rows.
  */
function parseMarkdownTable(lines: string[]) {
  const cleanRows = lines
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') || line.endsWith('|'));

  if (cleanRows.length < 2) return null;

  const parseRowCells = (row: string) =>
    row
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());

  const headerCells = parseRowCells(cleanRows[0]);
  
  // Check if second row is divider line (contains ---)
  let dataRowsStartIdx = 1;
  if (cleanRows[1] && cleanRows[1].includes('---')) {
    dataRowsStartIdx = 2;
  }

  const dataRows = cleanRows.slice(dataRowsStartIdx).map(parseRowCells);

  return { headerCells, dataRows };
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split content into blocks by lines
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];

  let i = 0;
  let blockKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Table Detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }

      const tableData = parseMarkdownTable(tableLines);
      if (tableData) {
        blocks.push(
          <div
            key={`table-${blockKey++}`}
            className="my-6 overflow-x-auto rounded-xl border border-white/[0.12] bg-[#121622]/90 shadow-2xl"
          >
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1B2130] border-b border-white/[0.12] text-[#06B6D4] font-mono font-semibold uppercase tracking-wider">
                  {tableData.headerCells.map((header, hIdx) => (
                    <th key={`th-${hIdx}`} className="px-4 py-3 border-r border-white/[0.06] last:border-r-0">
                      {renderInlineText(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {tableData.dataRows.map((row, rIdx) => (
                  <tr
                    key={`tr-${rIdx}`}
                    className="hover:bg-white/[0.03] transition-colors odd:bg-transparent even:bg-[#181D2A]/50"
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={`td-${rIdx}-${cIdx}`}
                        className="px-4 py-3 text-[#CBD5E1] border-r border-white/[0.06] last:border-r-0 leading-relaxed font-['Geist']"
                      >
                        {renderInlineText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 2. Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // 3. Headings
    if (trimmed.startsWith('# ')) {
      blocks.push(
        <h1
          key={`h1-${blockKey++}`}
          className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-['Geist'] mt-8 mb-4 border-b border-white/[0.08] pb-3"
        >
          {renderInlineText(trimmed.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h2
          key={`h2-${blockKey++}`}
          className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['Geist'] mt-7 mb-3 flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-[#06B6D4] inline-block shrink-0" />
          <span>{renderInlineText(trimmed.slice(3))}</span>
        </h2>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h3
          key={`h3-${blockKey++}`}
          className="text-lg font-semibold text-white tracking-tight font-['Geist'] mt-6 mb-2 text-[#E2E8F0]"
        >
          {renderInlineText(trimmed.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      blocks.push(
        <h4
          key={`h4-${blockKey++}`}
          className="text-base font-semibold text-cyan-300 font-['Geist'] mt-4 mb-2"
        >
          {renderInlineText(trimmed.slice(5))}
        </h4>
      );
      i++;
      continue;
    }

    // 4. Blockquotes
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push(
        <blockquote
          key={`quote-${blockKey++}`}
          className="my-5 p-4 rounded-xl bg-[#1E2433]/70 border-l-4 border-[#06B6D4] text-cyan-100 text-xs sm:text-sm italic leading-relaxed shadow-lg"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={`ql-${qIdx}`} className="my-1">
              {renderInlineText(ql)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 5. Unordered List Items (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))
      ) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push(
        <ul key={`ul-${blockKey++}`} className="my-4 space-y-2 pl-2">
          {listItems.map((item, itemIdx) => (
            <li key={`li-${itemIdx}`} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#CBD5E1]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] mt-2 shrink-0" />
              <div className="flex-1 leading-relaxed">{renderInlineText(item)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Ordered List Items (1. 2. 3.)
    if (/^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push(
        <ol key={`ol-${blockKey++}`} className="my-4 space-y-2 pl-2">
          {listItems.map((item, itemIdx) => (
            <li key={`oli-${itemIdx}`} className="flex items-start gap-3 text-xs sm:text-sm text-[#CBD5E1]">
              <span className="px-1.5 py-0.5 rounded bg-[#1E2433] text-[#06B6D4] font-mono text-[11px] font-bold border border-white/[0.08] shrink-0">
                {itemIdx + 1}
              </span>
              <div className="flex-1 leading-relaxed pt-0.5">{renderInlineText(item)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Fenced Code Blocks (```)
    if (trimmed.startsWith('```')) {
      const codeLang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // skip closing ```

      blocks.push(
        <div
          key={`codeblock-${blockKey++}`}
          className="my-5 rounded-xl border border-white/[0.12] bg-[#0E1118] overflow-hidden font-mono text-xs shadow-xl"
        >
          {codeLang && (
            <div className="px-4 py-2 bg-[#161B26] border-b border-white/[0.08] text-[#94A3B8] text-[11px] font-bold uppercase tracking-wider flex justify-between items-center">
              <span>{codeLang}</span>
              <span className="text-[10px] text-[#64748B]">Snippet</span>
            </div>
          )}
          <pre className="p-4 overflow-x-auto text-[#06B6D4] leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 8. Standard Paragraph
    blocks.push(
      <p
        key={`p-${blockKey++}`}
        className="my-3 text-xs sm:text-sm leading-relaxed text-[#CBD5E1] font-['Geist']"
      >
        {renderInlineText(trimmed)}
      </p>
    );
    i++;
  }

  return <div className={`markdown-body ${className}`}>{blocks}</div>;
};

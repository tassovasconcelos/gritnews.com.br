import React from 'react';
import { ListOrdered } from 'lucide-react';
import { ArticleBlock } from '../../types';

interface TableOfContentsProps {
  blocks: ArticleBlock[];
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ blocks }) => {
  const headings = blocks.filter(b => b.type === 'heading2' || b.type === 'heading3');

  if (headings.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-[#F7F9FC] border border-[#E2E8F0] rounded-2xl p-5 mb-8">
      <div className="flex items-center gap-2 mb-3 text-[#0B2343] font-bold text-base border-b border-[#E2E8F0] pb-2">
        <ListOrdered className="w-5 h-5 text-[#145EDB]" />
        <span>Índice do Artigo</span>
      </div>
      <nav className="space-y-2">
        {headings.map((item, idx) => {
          const isSub = item.type === 'heading3';
          const headingId = `heading-${item.id}`;
          return (
            <button
              key={item.id}
              onClick={() => scrollToHeading(headingId)}
              className={`block text-left text-sm transition-colors hover:text-[#145EDB] hover:underline ${
                isSub ? 'pl-4 text-[#5C6B7A]' : 'font-semibold text-[#10233F]'
              }`}
            >
              <span className="text-[#145EDB] mr-1.5 font-bold">{idx + 1}.</span>
              {item.content.replace(/\*\*/g, '')}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

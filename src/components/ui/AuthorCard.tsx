import React from 'react';
import { UserCheck, BookOpen, ArrowRight } from 'lucide-react';
import { AuthorProfile } from '../../types';

interface AuthorCardProps {
  author: AuthorProfile;
  onSelectAuthor?: (author: AuthorProfile) => void;
}

export const AuthorCard: React.FC<AuthorCardProps> = ({ author, onSelectAuthor }) => {
  return (
    <div
      onClick={() => onSelectAuthor && onSelectAuthor(author)}
      className="group bg-white border border-[#E2E8F0] rounded-2xl p-5 hover:border-[#145EDB] hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center gap-4"
    >
      <img
        src={author.avatar}
        alt={author.name}
        className="w-16 h-16 rounded-full object-cover border-2 border-[#145EDB]/20 group-hover:scale-105 transition-transform shrink-0"
      />
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-bold text-[#0B2343] group-hover:text-[#145EDB] transition-colors truncate">
          {author.name}
        </h4>
        <p className="text-xs font-semibold text-[#145EDB] truncate mb-1">{author.roleTitle}</p>
        <p className="text-xs text-[#5C6B7A] line-clamp-2">{author.bio}</p>
        <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-[#5C6B7A]">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-[#145EDB]" />
            {author.articlesCount} artigos
          </span>
          <span className="flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-[#22A06B]" />
            {author.followersCount} seguidores
          </span>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#FF8500] group-hover:translate-x-1 transition-all shrink-0" />
    </div>
  );
};

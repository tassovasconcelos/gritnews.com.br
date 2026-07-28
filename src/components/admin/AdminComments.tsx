import React, { useState } from 'react';
import { Check, X, Trash2, MessageSquare } from 'lucide-react';
import { Comment } from '../../types';
import { getComments, approveComment, deleteComment } from '../../lib/storage';

interface AdminCommentsProps {
  onShowToast: (msg: string) => void;
}

export const AdminComments: React.FC<AdminCommentsProps> = ({ onShowToast }) => {
  const [comments, setComments] = useState<Comment[]>(() => getComments());

  const refresh = () => setComments(getComments());

  const handleApprove = (id: string) => {
    approveComment(id);
    refresh();
    onShowToast('Comentário aprovado!');
  };

  const handleDelete = (id: string) => {
    deleteComment(id);
    refresh();
    onShowToast('Comentário removido.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-[#0B2343]">Moderação de Comentários</h1>
        <p className="text-sm text-[#5C6B7A]">Aprove ou rejeite comentários de leitores no portal</p>
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 space-y-4">
          {comments.map(c => (
            <div key={c.id} className="p-4 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-[#0B2343]">{c.authorName}</span>
                  <span className="text-[10px] text-gray-400">({c.authorEmail})</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${c.status === 'APPROVED' ? 'bg-[#22A06B]/10 text-[#22A06B]' : 'bg-amber-100 text-amber-800'}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-[#10233F]">{c.content}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {c.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleApprove(c.id)}
                    className="p-2 bg-[#22A06B] text-white rounded-lg hover:bg-[#1c875a]"
                    title="Aprovar"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className="p-8 text-center text-xs text-[#5C6B7A]">
              Nenhum comentário aguardando moderação.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

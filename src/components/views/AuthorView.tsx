import React, { useState } from 'react';
import { ArrowLeft, BookOpen, UserCheck, Mail, Linkedin, Twitter, Globe, ArrowRight, Eye } from 'lucide-react';
import { AuthorProfile, Article } from '../../types';
import { Modal } from '../ui/Modal';

interface AuthorViewProps {
  author: AuthorProfile;
  articles: Article[];
  onSelectArticle: (article: Article) => void;
  onBackToHome: () => void;
  onShowToast: (msg: string) => void;
}

export const AuthorView: React.FC<AuthorViewProps> = ({
  author,
  articles,
  onSelectArticle,
  onBackToHome,
  onShowToast
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const authorArticles = articles.filter(a => a.authorId === author.id);

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    if (!isFollowing) {
      onShowToast(`Você agora está seguindo ${author.name}!`);
    }
  };

  const handleSendContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactModalOpen(false);
    setContactMessage('');
    onShowToast('Sua mensagem editorial foi encaminhada para o autor!');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-12">
      <button
        onClick={onBackToHome}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145EDB] hover:text-[#0B2343]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar</span>
      </button>

      {/* Author Header Profile */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 md:p-10 shadow-md">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <img
            src={author.avatar}
            alt={author.name}
            className="w-28 h-28 rounded-full object-cover border-4 border-[#145EDB] shadow-lg shrink-0"
          />

          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-[#0B2343]">{author.name}</h1>
                <p className="text-sm font-bold text-[#145EDB]">{author.roleTitle}</p>
              </div>

              <div className="flex items-center gap-3 justify-center md:justify-start">
                <button
                  onClick={toggleFollow}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isFollowing
                      ? 'bg-[#22A06B] text-white'
                      : 'bg-[#FF8500] hover:bg-[#e07500] text-white'
                  }`}
                >
                  {isFollowing ? 'Seguindo Autor' : '+ Seguir Autor'}
                </button>

                <button
                  onClick={() => setContactModalOpen(true)}
                  className="px-4 py-2 bg-[#F7F9FC] hover:bg-[#EAF3FF] text-[#0B2343] border border-[#E2E8F0] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4 text-[#145EDB]" />
                  <span>Contato Editorial</span>
                </button>
              </div>
            </div>

            <p className="text-sm text-[#5C6B7A] leading-relaxed">{author.bio}</p>

            <div className="flex flex-wrap gap-2 items-center justify-center md:justify-start pt-2">
              <span className="text-xs font-bold text-gray-400 mr-2">Especialidades:</span>
              {author.specialties.map(spec => (
                <span
                  key={spec}
                  className="bg-[#EAF3FF] text-[#145EDB] text-xs font-bold px-3 py-1 rounded-full border border-[#145EDB]/20"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Author Articles Feed */}
      <div>
        <h2 className="text-2xl font-bold text-[#0B2343] mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-[#145EDB]" />
          Artigos Publicados por {author.name} ({authorArticles.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authorArticles.map(art => (
            <div
              key={art.id}
              onClick={() => onSelectArticle(art)}
              className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#145EDB] rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <img
                src={art.featuredImage}
                alt={art.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
              />
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#10233F] group-hover:text-[#145EDB] transition-colors mb-2 line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-xs text-[#5C6B7A] line-clamp-2 mb-4">{art.summary}</p>
                </div>
                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold text-[#145EDB]">
                  <span>Ler artigo</span>
                  <ArrowRight className="w-4 h-4 text-[#FF8500]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Modal */}
      <Modal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title={`Contato Editorial com ${author.name}`}
      >
        <form onSubmit={handleSendContact} className="space-y-4">
          <p className="text-xs text-[#5C6B7A]">
            Envie pautas, sugestões ou dúvidas técnicas diretamente para a equipe de redação deste autor.
          </p>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Seu E-mail *</label>
            <input
              type="email"
              required
              placeholder="seu.email@empresa.com.br"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0B2343] mb-1">Mensagem ou Pauta *</label>
            <textarea
              required
              rows={4}
              placeholder="Descreva a pauta ou oportunidade corporativa..."
              value={contactMessage}
              onChange={e => setContactMessage(e.target.value)}
              className="w-full px-4 py-2 bg-[#F7F9FC] border border-[#E2E8F0] rounded-xl text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#145EDB] text-white font-bold py-3 rounded-xl text-sm shadow-md"
          >
            Enviar Mensagem Editorial
          </button>
        </form>
      </Modal>
    </div>
  );
};

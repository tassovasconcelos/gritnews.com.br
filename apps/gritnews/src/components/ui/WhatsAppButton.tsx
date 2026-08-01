import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  defaultMessage?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phoneNumber = '5585921716546',
  defaultMessage = 'Olá! Vim pelo portal GRIT NEWS e gostaria de informações sobre parcerias, pautas ou patrocínio.'
}) => {
  const encodedMessage = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/20"
      title="Falar no WhatsApp GRIT NEWS (85 92171-6546)"
      aria-label="Atendimento via WhatsApp (85 92171-6546)"
    >
      <MessageCircle className="w-6 h-6 fill-current stroke-none animate-bounce" />
      <span className="hidden sm:inline-block text-xs font-black tracking-wide">
        Falar no WhatsApp
      </span>
      <span className="absolute -top-2 -right-1 bg-red-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-white shadow-sm">
        ON
      </span>
    </a>
  );
};

import React from 'react';
import { SacProhApp } from '../../sacproh';

interface SacProhViewProps {
  onShowToast: (message: string, type?: 'success' | 'info') => void;
  onNavigateHome: () => void;
}

export const SacProhView: React.FC<SacProhViewProps> = ({ onShowToast, onNavigateHome }) => {
  return <SacProhApp onShowToast={onShowToast} onNavigateHome={onNavigateHome} />;
};

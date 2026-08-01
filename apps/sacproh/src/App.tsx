import React, { useState } from 'react';
import { SacProhApp } from './SacProhApp';
import { Toast } from '@gritnews/ui';

export const App: React.FC = () => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
  };

  return (
    <>
      <SacProhApp onShowToast={showToast} />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default App;

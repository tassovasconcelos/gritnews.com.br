import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main>
      <section className="card">
        <span className="eyebrow">Ecossistema GRIT</span>
        <h1>Meu Orçamento</h1>
        <p>Orçamento rápido. Acompanhamento simples. Mais chance de fechar.</p>
        <p className="status">Aplicação em preparação para homologação.</p>
        <a href="https://gritnews.com.br/produtos/meu-orcamento/">Conhecer a solução</a>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
);

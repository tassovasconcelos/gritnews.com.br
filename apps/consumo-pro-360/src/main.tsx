import React, {Suspense} from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

class AppBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<main className="empty" role="alert"><h1>Não foi possível abrir esta tela</h1><p>Atualize para carregar a versão mais recente. Seus registros permanecem no sistema.</p><button onClick={()=>window.location.reload()}>Atualizar aplicativo</button></main>:this.props.children;}
}

createRoot(document.getElementById("root")!).render(<React.StrictMode><AppBoundary><Suspense fallback={<main className="empty" role="status">Carregando a ferramenta…</main>}><App/></Suspense></AppBoundary></React.StrictMode>);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => { navigator.serviceWorker.register("/sw.js").catch(() => { console.warn("Não foi possível atualizar o modo de instalação do aplicativo."); }); });
}

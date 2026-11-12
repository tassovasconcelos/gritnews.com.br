import { Component, type ReactNode } from 'react';
export default class ModuleBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<section className="ops-panel" role="alert"><h2>Não foi possível abrir esta área</h2><p>Seu pedido salvo permanece no sistema. Reabra a área; se houver confirmação pendente, consulte o pedido antes de repetir uma venda.</p><button onClick={()=>this.setState({failed:false})}>Reabrir área</button><a href="/admin/operacoes">Voltar à central</a></section>:this.props.children;}
}

import { useState } from 'react';
import { currentCustomerPath } from './customerRoute';
import { confirmationRedirect, resendSignupConfirmation } from './authLinks';

type Client = Parameters<typeof resendSignupConfirmation>[0];

export function AccountConfirmation({ client, email }: { client: Client | null; email: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function resend() {
    if (!client || busy) return;
    setBusy(true);
    setMessage('');
    try {
      await resendSignupConfirmation(client, email, confirmationRedirect(location.origin, location.search, currentCustomerPath()));
      setMessage('Se houver uma confirmação pendente, confira sua caixa de entrada e o spam.');
    } catch {
      setMessage('Não foi possível solicitar agora. Confira o e-mail e aguarde um minuto antes de tentar novamente.');
    } finally { setBusy(false); }
  }
  return <div className="ops-account-confirmation">
    <p>Seu e-mail ainda não foi confirmado?</p>
    <button type="button" disabled={busy || !client || !email.trim()} onClick={resend}>
      {busy ? 'Solicitando confirmação...' : 'Reenviar confirmação de e-mail'}
    </button>
    {message && <p role="status">{message}</p>}
  </div>;
}

export function PasswordSetup({ client, onDone, minLength = 10, describeError }: {
  client: { auth: { updateUser: (values: { password: string }) => Promise<{ error: unknown }> } };
  onDone: () => void;
  minLength?: number;
  describeError?: (error: unknown) => string;
}) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (password.length < minLength || password !== confirmation) {
      setMessage(`Use pelo menos ${minLength} caracteres e repita a mesma senha nos dois campos.`);
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      setPassword(''); setConfirmation(''); onDone();
    } catch (error) {
      setMessage(describeError ? describeError(error) : 'Não foi possível salvar a senha. Solicite um novo link de recuperação e tente novamente.');
    } finally { setBusy(false); }
  }
  return <main className="auth-shell"><section className="auth-card">
    <h1>Defina sua senha</h1><p>Conclua seu primeiro acesso ou a recuperação da conta.</p>
    <form onSubmit={save} className="auth-form ops-password-form">
      <label>Nova senha<input type="password" autoComplete="new-password" minLength={minLength} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label>Confirme a senha<input type="password" autoComplete="new-password" minLength={minLength} required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      <button type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Salvar senha e continuar'}</button>
      {message && <p role="alert">{message}</p>}
    </form>
  </section></main>;
}

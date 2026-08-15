/**
 * ============================================================================
 * GERADOR DE PIX COPIA E COLA (PADRÃO BR CODE / EMVCo BANCO CENTRAL DO BRASIL)
 * & UTILITÁRIOS DE INTEGRAÇÃO MERCADO PAGO
 * ============================================================================
 */

export interface PixPayloadParams {
  pixKey: string;
  pixKeyType?: 'email' | 'cpf' | 'cnpj' | 'phone' | 'random';
  beneficiaryName: string;
  beneficiaryCity?: string;
  amount?: number;
  txId?: string;
  description?: string;
}

/**
 * Remove acentos e caracteres especiais para conformidade com a especificação EMVCo
 */
export function sanitizeAscii(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toUpperCase();
}

/**
 * Formata um campo TLV (Tag, Length, Value)
 */
function formatTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Calcula o CRC16-CCITT (Polinômio 0x1021, Inicial 0xFFFF)
 */
export function calculateCrc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera a string oficial do PIX Copia e Cola (BR Code EMVCo)
 */
export function generatePixBrCode(params: PixPayloadParams): string {
  const {
    pixKey,
    beneficiaryName,
    beneficiaryCity = 'FORTALEZA',
    amount,
    txId = '***',
    description
  } = params;

  if (!pixKey || !pixKey.trim()) {
    return '';
  }

  const cleanKey = pixKey.trim();
  const cleanName = sanitizeAscii(beneficiaryName || 'TASSO VASCONCELOS').slice(0, 25).trim();
  const cleanCity = sanitizeAscii(beneficiaryCity || 'FORTALEZA').slice(0, 15).trim();
  const cleanTxId = (txId ? sanitizeAscii(txId).replace(/\s+/g, '') : '***').slice(0, 25) || '***';

  // 00 - Payload Format Indicator (01)
  const f00 = formatTlv('00', '01');

  // 26 - Merchant Account Information (PIX)
  // Sub 00: GUI (br.gov.bcb.pix)
  // Sub 01: Chave PIX
  // Sub 02: Descrição (opcional)
  let sub26 = formatTlv('00', 'br.gov.bcb.pix') + formatTlv('01', cleanKey);
  if (description) {
    const cleanDesc = sanitizeAscii(description).slice(0, 40);
    sub26 += formatTlv('02', cleanDesc);
  }
  const f26 = formatTlv('26', sub26);

  // 52 - Merchant Category Code (0000 = Geral)
  const f52 = formatTlv('52', '0000');

  // 53 - Transaction Currency (986 = BRL)
  const f53 = formatTlv('53', '986');

  // 54 - Transaction Amount (opcional se for chave aberta, fixo se com valor)
  let f54 = '';
  if (amount && amount > 0) {
    f54 = formatTlv('54', amount.toFixed(2));
  }

  // 58 - Country Code (BR)
  const f58 = formatTlv('58', 'BR');

  // 59 - Merchant Name
  const f59 = formatTlv('59', cleanName || 'BENEFICIARIO');

  // 60 - Merchant City
  const f60 = formatTlv('60', cleanCity || 'FORTALEZA');

  // 62 - Additional Data Field Template (TxID)
  const sub62 = formatTlv('05', cleanTxId);
  const f62 = formatTlv('62', sub62);

  // 63 - CRC16 (Tag + Length '04' antes do cálculo)
  const rawPayload = `${f00}${f26}${f52}${f53}${f54}${f58}${f59}${f60}${f62}6304`;
  const checksum = calculateCrc16(rawPayload);

  return `${rawPayload}${checksum}`;
}

/**
 * Validação simples de formato de chave PIX
 */
export function validatePixKey(key: string, type: string): { isValid: boolean; message?: string } {
  if (!key || !key.trim()) {
    return { isValid: false, message: 'Chave PIX não pode ficar em branco.' };
  }

  const clean = key.trim();

  switch (type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(clean) 
        ? { isValid: true } 
        : { isValid: false, message: 'E-mail inválido. Exemplo: seuemail@gmail.com' };
    
    case 'cpf':
      const cpfDigits = clean.replace(/\D/g, '');
      return cpfDigits.length === 11
        ? { isValid: true }
        : { isValid: false, message: 'CPF deve conter 11 dígitos.' };

    case 'cnpj':
      const cnpjDigits = clean.replace(/\D/g, '');
      return cnpjDigits.length === 14
        ? { isValid: true }
        : { isValid: false, message: 'CNPJ deve conter 14 dígitos.' };

    case 'phone':
      const phoneDigits = clean.replace(/\D/g, '');
      return (phoneDigits.length >= 10 && phoneDigits.length <= 13)
        ? { isValid: true }
        : { isValid: false, message: 'Telefone com DDD inválido. Ex: +5585991234567' };

    case 'random':
      return clean.length >= 32
        ? { isValid: true }
        : { isValid: false, message: 'Chave aleatória (EVP) possui 32 ou mais caracteres.' };

    default:
      return { isValid: true };
  }
}

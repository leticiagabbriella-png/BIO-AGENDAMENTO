/**
 * Utility functions for generating WhatsApp Web/App deep links with pre-formatted messages
 */

export function cleanPhoneNumber(phone: string): string {
  // Remove spaces, parentheses, dashes
  const digits = phone.replace(/\D/g, '');
  // If Brazilian number without country code (10 or 11 digits), prepend 55
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDatePtBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * URL for client to send their appointment confirmation directly to clinic WhatsApp
 */
export function getWhatsAppAppointmentConfirmUrl(
  clinicWhatsapp: string,
  clientName: string,
  serviceName: string,
  dateStr: string,
  timeStr: string,
  price: number
): string {
  const cleanNum = cleanPhoneNumber(clinicWhatsapp);
  const formattedDate = formatDatePtBR(dateStr);
  const formattedPrice = formatBRL(price);

  const text = `Olá! Acabei de realizar meu agendamento online pela página da clínica:
✨ *Procedimento:* ${serviceName}
🗓️ *Data:* ${formattedDate}
⏰ *Horário:* ${timeStr}
💰 *Valor:* ${formattedPrice}
👤 *Paciente:* ${clientName}

Gostaria de confirmar meu horário, por favor! 💕`;

  return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
}

/**
 * Floating WhatsApp button for client to chat with clinic
 */
export function getWhatsAppGeneralChatUrl(clinicWhatsapp: string, clinicName: string): string {
  const cleanNum = cleanPhoneNumber(clinicWhatsapp);
  const text = `Olá! Gostaria de tirar algumas dúvidas sobre os procedimentos da ${clinicName} antes de agendar.`;
  return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
}

/**
 * URL for practitioner to send a reminder or confirmation to client from the admin panel
 */
export function getPractitionerReminderWhatsAppUrl(
  clientPhone: string,
  clientName: string,
  serviceName: string,
  dateStr: string,
  timeStr: string,
  clinicName: string
): string {
  const cleanNum = cleanPhoneNumber(clientPhone);
  const formattedDate = formatDatePtBR(dateStr);

  const text = `Olá ${clientName}! ✨
Passando para confirmar seu horário na *${clinicName}*:

💆‍♀️ *Procedimento:* ${serviceName}
🗓️ *Data:* ${formattedDate}
⏰ *Horário:* ${timeStr}

Tudo pronto para receber você com muito carinho e cuidado! Caso tenha qualquer dúvida ou precise de orientações prévias, basta responder esta mensagem. Até breve! 💕`;

  return `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}`;
}

/**
 * WhatsApp message for practitioner to invite client to book online
 */
export function getPractitionerInviteWhatsAppUrl(
  clientPhone: string,
  bookingUrl: string,
  clinicName: string,
  practitionerName: string
): string {
  const cleanNum = cleanPhoneNumber(clientPhone);
  const text = `Olá! Tudo bem? ✨
Aqui é a ${practitionerName} da *${clinicName}*.

Pensando no seu conforto e praticidade, você agora pode agendar seus procedimentos diretamente pelo nosso link online, escolhendo o dia e o horário que preferir:

👉 ${bookingUrl}

Qualquer dúvida estou sempre por aqui no WhatsApp! 💕`;

  return cleanNum ? `https://wa.me/${cleanNum}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
}

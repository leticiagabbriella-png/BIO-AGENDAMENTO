import { ClinicService, ClinicProfile, ScheduleConfig, Appointment } from '../types/index.ts';

// Import local high-resolution generated images
import heroClinicImg from '../assets/images/hero_aesthetic_clinic_1790881725106.jpg';
import facialImg from '../assets/images/service_facial_treatment_1790881736374.jpg';
import lipImg from '../assets/images/service_lip_enhancement_1790881744107.jpg';
import laserImg from '../assets/images/service_laser_skin_1790881753486.jpg';

export { heroClinicImg, facialImg, lipImg, laserImg };

export const DEFAULT_CLINIC_PROFILE: ClinicProfile = {
  name: 'Lumière · Estética Avançada',
  practitionerName: 'Dra. Letícia Gabriella',
  title: 'Biomédica Esteta & Especialista em Rejuvenescimento Facial',
  phone: '(11) 99399-6068',
  whatsappNumber: '5511993996068',
  instagram: '@lumiere.estetica',
  address: 'Av. Brigadeiro Faria Lima, 3477 - 8º andar - Itaim Bibi, São Paulo - SP',
  bio: 'Espaço exclusivo dedicado à valorização da sua beleza natural. Procedimentos minimamente invasivos, protocolos personalizados e tecnologia de ponta com segurança e conforto.',
  bookingNotice: 'Tolerância de 15 minutos. Caso necessite remarcar, por gentileza avise com 24h de antecedência via WhatsApp.',
};

export const DEFAULT_SERVICES: ClinicService[] = [
  {
    id: 'serv-1',
    name: 'Toxina Botulínica (Botox) Full Face',
    category: 'injetaveis',
    durationMinutes: 45,
    price: 1250,
    description: 'Suavização elegante e natural de linhas de expressão na testa, glabela e pés de galinha com produtos de padrão ouro.',
    imageUrl: lipImg,
    active: true,
    benefits: ['Aspecto descansado e rejuvenescido', 'Sem perda de expressividade', 'Resultados em até 15 dias'],
  },
  {
    id: 'serv-2',
    name: 'Preenchimento Labial & Hidratação',
    category: 'injetaveis',
    durationMinutes: 60,
    price: 1100,
    description: 'Definição de contorno, projeção sutil e hidratação profunda dos lábios com ácido hialurônico de alta biocompatibilidade.',
    imageUrl: lipImg,
    active: true,
    benefits: ['Lábios harmônicos e naturais', 'Hidratação e viço imediato', 'Procedimento com anestésico local'],
  },
  {
    id: 'serv-3',
    name: 'Limpeza de Pele Profunda com Fototerapia LED',
    category: 'facial',
    durationMinutes: 75,
    price: 240,
    description: 'Higienização profunda com extração indolor, peeling de diamante, máscara calmante e banho de luz LED para regeneração celular.',
    imageUrl: facialImg,
    active: true,
    benefits: ['Remoção de impurezas e cravos', 'Ação anti-inflamatória e bactericida', 'Pele luminosa e aveludada'],
  },
  {
    id: 'serv-4',
    name: 'Laser Lavieen Glow BB Laser',
    category: 'laser',
    durationMinutes: 50,
    price: 690,
    description: 'O famoso efeito BB Cream na pele: fechamento de poros, uniformização do tom, estímulo de colágeno e brilho espelhado.',
    imageUrl: laserImg,
    active: true,
    benefits: ['Clareamento de manchas suaves', 'Redução visível de poros dilatados', 'Efeito glow imediato e duradouro'],
  },
  {
    id: 'serv-5',
    name: 'Bioestimulador de Colágeno (Radiesse / Sculptra)',
    category: 'injetaveis',
    durationMinutes: 60,
    price: 2200,
    description: 'Estímulo biológico profundo para firmeza da pele, melhora da flacidez e definição do contorno da mandíbula.',
    imageUrl: lipImg,
    active: true,
    benefits: ['Recupera a firmeza e elasticidade', 'Resultados graduais e duradouros (até 24 meses)', 'Aumento da espessura dérmica'],
  },
  {
    id: 'serv-6',
    name: 'Peeling Químico Renovador & Despigmentante',
    category: 'facial',
    durationMinutes: 45,
    price: 320,
    description: 'Ácidos biocompatíveis para renovação celular acelerada, redução de manchas solares, melasma e controle de oleosidade.',
    imageUrl: facialImg,
    active: true,
    benefits: ['Textura uniforme e suave', 'Atenuação de manchas e linhas finas', 'Controle eficaz da oleosidade'],
  },
  {
    id: 'serv-7',
    name: 'Drenagem Linfática Facial & Corporal',
    category: 'corporal',
    durationMinutes: 60,
    price: 190,
    description: 'Manobras manuais exclusivas para redução de retenção hídrica, alívio de inchaço pós-operatório ou rotineiro e relaxamento.',
    imageUrl: facialImg,
    active: true,
    benefits: ['Desinchaço imediato e sensação de leveza', 'Eliminação de toxinas acumuladas', 'Melhora da circulação periférica'],
  },
];

export const DEFAULT_SCHEDULE_CONFIG: ScheduleConfig = {
  daysOfWeek: [1, 2, 3, 4, 5, 6], // Segunda a Sábado
  startHour: '09:00',
  endHour: '19:00',
  intervalMinutes: 60,
  lunchBreakStart: '12:00',
  lunchBreakEnd: '13:00',
  blockedDates: [],
};

// Generate realistic today/tomorrow appointments for demo initial state
const getFormattedDate = (daysAhead: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
};

export const DEFAULT_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    clientName: 'Camila Albuquerque',
    clientPhone: '(11) 98123-4567',
    clientEmail: 'camila.alb@gmail.com',
    serviceId: 'serv-1',
    serviceName: 'Toxina Botulínica (Botox) Full Face',
    servicePrice: 1250,
    serviceDuration: 45,
    date: getFormattedDate(0),
    time: '10:00',
    status: 'confirmed',
    notes: 'Segunda aplicação anual de manutenção.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-2',
    clientName: 'Mariana Duarte',
    clientPhone: '(11) 97654-3210',
    clientEmail: 'mariana.duarte@hotmail.com',
    serviceId: 'serv-3',
    serviceName: 'Limpeza de Pele Profunda com Fototerapia LED',
    servicePrice: 240,
    serviceDuration: 75,
    date: getFormattedDate(0),
    time: '14:00',
    status: 'pending',
    notes: 'Primeira vez na clínica. Pele sensível.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-3',
    clientName: 'Beatriz Fonseca',
    clientPhone: '(11) 99887-1122',
    clientEmail: 'bia.fonseca@outlook.com',
    serviceId: 'serv-2',
    serviceName: 'Preenchimento Labial & Hidratação',
    servicePrice: 1100,
    serviceDuration: 60,
    date: getFormattedDate(1),
    time: '15:00',
    status: 'confirmed',
    notes: 'Deseja efeito natural e arco do cupido definido.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'apt-4',
    clientName: 'Juliana Rios',
    clientPhone: '(11) 99111-2233',
    serviceId: 'serv-4',
    serviceName: 'Laser Lavieen Glow BB Laser',
    servicePrice: 690,
    serviceDuration: 50,
    date: getFormattedDate(2),
    time: '11:00',
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  },
];

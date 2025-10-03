import { faker } from '@faker-js/faker';
import { 
    Agent, Admin, AdminRole, FuneralPackage, MedicalPackage, CashBackAddon, 
    Customer, Participant, AppRequest, PolicyStatus, RequestType, MakePaymentRequest, 
    RequestStatus, PaymentMethod, ChatMessage 
} from './types';
import { calculatePremiumComponents, getNextPaymentPeriod } from './utils/policyHelpers';

// --- STATIC DATA ---

export const AGENTS: Agent[] = [
  { id: 101, firstName: 'Tariro', surname: 'Moyo', email: 'tariro.m@stoneriver.com', profilePictureUrl: '' },
  { id: 102, firstName: 'Fadzai', surname: 'Chauke', email: 'fadzai.c@stoneriver.com', profilePictureUrl: '' },
  { id: 103, firstName: 'Tendai', surname: 'Banda', email: 'tendai.b@stoneriver.com', profilePictureUrl: '' },
];

export const ADMINS: Admin[] = [
  { id: 901, firstName: 'Rudo', surname: 'Gumbo', role: AdminRole.MANAGER, email: 'rudo.g@stoneriver.com', profilePictureUrl: '' },
  { id: 902, firstName: 'Simba', surname: 'Ncube', role: AdminRole.UNDERWRITER, email: 'simba.n@stoneriver.com', profilePictureUrl: '' },
];

export const FUNERAL_PACKAGE_DETAILS: Record<string, { description: string; benefits: string[], rules?: string[] }> = {
    [FuneralPackage.STANDARD]: {
        description: "Our essential plan, covering basic funeral expenses and services.",
        benefits: ["$2,500 Payout", "Basic Casket", "Transportation (50km radius)"],
        rules: ["Base cost of $2.50 for policyholder.", "Each additional member is $1.25."]
    },
    [FuneralPackage.PREMIUM]: {
        description: "An enhanced plan with higher payouts and additional benefits for your family.",
        benefits: ["$5,000 Payout", "Standard Casket", "Transportation (100km radius)", "Catering Vouchers"],
        rules: ["Base cost of $5.00 for policyholder.", "Each additional member is $2.50."]
    },
    [FuneralPackage.PLATINUM]: {
        description: "Our most comprehensive plan, offering maximum support and luxury services.",
        benefits: ["$10,000 Payout", "Executive Casket", "Nationwide Transportation", "Full Catering Service", "Tombstone Voucher"],
        rules: ["Base cost of $10.00 for policyholder.", "Each additional member is $5.00."]
    },
    [FuneralPackage.MUSLIM_STANDARD]: {
        description: "A plan designed to meet the specific needs of the Muslim community.",
        benefits: ["Full burial cost coverage", "Adherence to religious customs", "Support for family"],
        rules: ["Base cost of $5.00 covers policyholder and one spouse.", "Each additional member (spouse, child, dependent) is $2.50.", "A single policyholder is $2.50."]
    },
    [FuneralPackage.ALKAANE]: {
        description: "A premium funeral plan with a cash-back benefit for long-term, claim-free members.",
        benefits: ["Funeral cover", "Cash-back benefits after a no-claim period"],
        rules: ["Cost is $18.00 per person (policyholder and all dependents)."]
    }
};

export const MEDICAL_PACKAGE_DETAILS: Record<MedicalPackage, { name: string; price: number }> = {
    [MedicalPackage.NONE]: { name: 'No Medical Aid', price: 0 },
    [MedicalPackage.ZIMHEALTH]: { name: 'ZimHealth', price: 1.00 },
    [MedicalPackage.FAMILY_LIFE]: { name: 'Family Life', price: 7.00 },
    [MedicalPackage.ALKAANE]: { name: 'Alkaane', price: 18.00 },
};

export const CASH_BACK_DETAILS: Record<CashBackAddon, { name: string; price: number; payout: number }> = {
    [CashBackAddon.NONE]: { name: 'No Cash Back', price: 0, payout: 0 },
    [CashBackAddon.CB1]: { name: 'CB1 ($250 Payout)', price: 1.00, payout: 250 },
    [CashBackAddon.CB2]: { name: 'CB2 ($500 Payout)', price: 2.00, payout: 500 },
    [CashBackAddon.CB3]: { name: 'CB3 ($750 Payout)', price: 3.00, payout: 750 },
    [CashBackAddon.CB4]: { name: 'CB4 ($1000 Payout)', price: 4.00, payout: 1000 },
};


// --- DYNAMIC MOCK DATA GENERATION ---

const generateMockData = () => {
    const customers: Customer[] = [];
    const requests: AppRequest[] = [];
    const messages: ChatMessage[] = [];

    return { customers, requests, messages };
};


const mockData = generateMockData();
export const CUSTOMERS = mockData.customers;
export const REQUESTS = mockData.requests;
export const MESSAGES = mockData.messages;
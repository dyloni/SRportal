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
    [FuneralPackage.LITE]: {
        description: "Affordable coverage for your entire family with essential funeral services.",
        benefits: [
            "$2.50 per head benefit",
            "2 Tier Casket",
            "$50 Grocery voucher",
            "Hearse within 50km radius",
            "Bus transportation at $1.50 per km",
            "Grave equipment included"
        ],
        rules: [
            "Family package price: $5.00 per month",
            "Covers: Member, Spouse, and up to 4 children (biological/step/grand/siblings)",
            "Children covered up to age 18 (or 23 if student with school ID)",
            "Dependents above 64 years: +$2.50 per person"
        ]
    },
    [FuneralPackage.STANDARD]: {
        description: "Enhanced coverage with better benefits and quality casket options.",
        benefits: [
            "$4.00 per head benefit",
            "Boston Dome Casket",
            "$80 Grocery voucher",
            "Hearse transportation",
            "Bus transportation at $1.50 per km",
            "Grave equipment included"
        ],
        rules: [
            "Family package price: $8.00 per month",
            "Covers: Member, Spouse, and up to 4 children (biological/step/grand/siblings)",
            "Children covered up to age 18 (or 23 if student with school ID)",
            "Dependents above 64 years: +$2.50 per person"
        ]
    },
    [FuneralPackage.PREMIUM]: {
        description: "Comprehensive coverage with premium benefits and full transportation support.",
        benefits: [
            "$7.50 per head benefit",
            "Wrap Around Dome Casket",
            "$150 Grocery voucher",
            "Hearse transportation",
            "Bus transportation included",
            "Grave equipment included"
        ],
        rules: [
            "Family package price: $15.00 per month",
            "Covers: Member, Spouse, and up to 4 children (biological/step/grand/siblings)",
            "Children covered up to age 18 (or 23 if student with school ID)",
            "No additional charge for dependents above 64 years"
        ]
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
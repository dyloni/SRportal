// FIX: Removed circular self-import of AdminRole and defined it as an enum.
// --- ENUMS ---

export enum AdminRole {
    MANAGER = 'Manager',
    UNDERWRITER = 'Underwriter',
}

export enum FuneralPackage {
    STANDARD = 'Standard Funeral Plan',
    PREMIUM = 'Premium Funeral Plan',
    PLATINUM = 'Platinum Funeral Plan',
    MUSLIM_STANDARD = 'Muslim Standard Plan',
    ALKAANE = 'Alkaane Plan',
}

export enum MedicalPackage {
    NONE = 'No Medical Aid',
    ZIMHEALTH = 'ZimHealth',
    FAMILY_LIFE = 'Family Life',
    ALKAANE = 'Alkaane',
}

export enum CashBackAddon {
    NONE = 'No Cash Back',
    CB1 = 'CB1',
    CB2 = 'CB2',
    CB3 = 'CB3',
    CB4 = 'CB4',
}

export enum PolicyStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
    OVERDUE = 'Overdue',
    CANCELLED = 'Cancelled',
}

export enum RequestType {
    NEW_POLICY = 'New Policy',
    EDIT_CUSTOMER_DETAILS = 'Edit Customer Details',
    ADD_DEPENDENT = 'Add Dependent',
    POLICY_UPGRADE = 'Policy Upgrade',
    POLICY_DOWNGRADE = 'Policy Downgrade',
    MAKE_PAYMENT = 'Make Payment',
}

export enum RequestStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
}

export enum PaymentMethod {
    CASH = 'Cash',
    ECOCASH = 'EcoCash',
    BANK_TRANSFER = 'Bank Transfer',
    STOP_ORDER = 'Stop Order',
}

// --- CORE DATA MODELS ---

export interface Agent {
    id: number;
    firstName: string;
    surname: string;
    email?: string;
    profilePictureUrl?: string;
}

export interface Admin {
    id: number;
    firstName: string;
    surname: string;
    role: AdminRole;
    email?: string;
    profilePictureUrl?: string;
}

export interface Participant {
    id: number;
    uuid: string;
    firstName: string;
    surname: string;
    relationship: 'Self' | 'Spouse' | 'Child' | 'Other Dependent';
    dateOfBirth: string;
    idNumber?: string;
    gender?: 'Male' | 'Female';
    isStudent?: boolean;
    phone?: string;
    email?: string;
    streetAddress?: string;
    town?: string;
    postalAddress?: string;
    medicalPackage?: MedicalPackage;
    cashBackAddon?: CashBackAddon;
}

export interface Customer {
    id: number;
    uuid: string;
    policyNumber: string;
    firstName: string;
    surname: string;
    inceptionDate: string;
    coverDate: string;
    status: PolicyStatus;
    assignedAgentId: number;
    // Personal Details
    idNumber: string;
    dateOfBirth: string;
    gender: 'Male' | 'Female';
    phone: string;
    email: string;
    // Address
    streetAddress: string;
    town: string;
    postalAddress: string;
    // Policy Details
    funeralPackage: FuneralPackage;
    participants: Participant[];
    // Premium Details
    policyPremium: number;
    addonPremium: number;
    totalPremium: number;
    // Payment Status
    premiumPeriod: string;
    latestReceiptDate: string | null;
    // Timestamps
    dateCreated: string;
    lastUpdated: string;
}

export interface ChatMessage {
    id: number | string;
    senderId: number | 'admin' | 'broadcast';
    senderName: string;
    recipientId: number | 'admin' | 'broadcast';
    text: string;
    timestamp: string;
    status: 'read' | 'unread';
}

// --- CLAIMS ---

export enum ClaimStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
    PAID = 'Paid',
}

export interface Claim {
    id: number;
    customerId: number;
    policyNumber: string;
    customerName: string;
    deceasedName: string;
    deceasedParticipantId: number;
    dateOfDeath: string;
    claimAmount: number;
    status: ClaimStatus;
    filedBy: number | 'admin';
    filedByName: string;
    filedDate: string;
    approvedDate?: string;
    paidDate?: string;
    notes?: string;
    deathCertificateFilename?: string;
}

// --- REDUCER ACTION TYPE ---

export type Action =
  | { type: 'SET_INITIAL_DATA'; payload: { customers: Customer[]; claims: Claim[]; messages: ChatMessage[] } }
  | { type: 'ADD_CLAIM'; payload: Claim }
  | { type: 'UPDATE_CLAIM'; payload: Claim }
  | { type: 'SEND_MESSAGE'; payload: ChatMessage }
  | { type: 'MARK_MESSAGES_AS_READ'; payload: { chatPartnerId: number | 'admin'; currentUserId: number | 'admin' } }
  | { type: 'BULK_ADD_CUSTOMERS'; payload: Customer[] }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer };
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

export enum ClaimStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
    PAID = 'Paid',
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

export interface Payment {
    id: number;
    customer_id: number;
    policy_number: string;
    payment_amount: string;
    payment_method: PaymentMethod;
    payment_period: string;
    receipt_filename: string | null;
    recorded_by_agent_id: number | null;
    payment_date: string;
    created_at: string;
    updated_at: string;
}

export interface Claim {
    id: number;
    customer_id: number;
    policy_number: string;
    customer_name: string;
    deceased_name: string;
    deceased_participant_id: number;
    date_of_death: string;
    claim_amount: number;
    status: ClaimStatus;
    filed_by: string;
    filed_by_name: string;
    filed_date: string;
    approved_date?: string;
    paid_date?: string;
    notes?: string;
    death_certificate_filename?: string;
    created_at: string;
    updated_at: string;
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

// --- REQUESTS ---
// This will be a union of all specific request types

interface BaseRequest {
    id: number;
    agentId: number;
    status: RequestStatus;
    createdAt: string;
    adminNotes?: string;
}

export interface NewPolicyRequestData {
    firstName: string;
    surname: string;
    idNumber: string;
    dateOfBirth: string;
    gender: 'Male' | 'Female';
    phone: string;
    email: string;
    streetAddress: string;
    town: string;
    postalAddress: string;
    participants: (Omit<Participant, 'id' | 'uuid'>)[];
    funeralPackage: FuneralPackage;
    paymentMethod: PaymentMethod;
    receiptFilename: string;
    idPhotoFilename: string;
}

export interface NewPolicyRequest extends BaseRequest {
    requestType: RequestType.NEW_POLICY;
    customerData: NewPolicyRequestData;
    idPhotoFilename: string;
    paymentAmount: number;
    paymentMethod: PaymentMethod;
    receiptFilename: string;
}

export interface EditCustomerDetailsRequest extends BaseRequest {
    requestType: RequestType.EDIT_CUSTOMER_DETAILS;
    customerId: number;
    oldValues: Partial<Customer>;
    newValues: Partial<Customer>;
}

export interface AddDependentRequestType extends BaseRequest {
    requestType: RequestType.ADD_DEPENDENT;
    customerId: number;
    dependentData: Omit<Participant, 'id' | 'uuid'>;
}

export interface PolicyUpgradeRequest extends BaseRequest {
    requestType: RequestType.POLICY_UPGRADE;
    customerId: number;
    details: string; // e.g., "From Standard to Premium"
}

export interface PolicyDowngradeRequest extends BaseRequest {
    requestType: RequestType.POLICY_DOWNGRADE;
    customerId: number;
    details: string; // e.g., "From Premium to Standard"
}

export interface MakePaymentRequest extends BaseRequest {
    requestType: RequestType.MAKE_PAYMENT;
    customerId: number;
    paymentAmount: number;
    paymentType: 'Initial' | 'Renewal';
    paymentMethod: PaymentMethod;
    paymentPeriod: string;
    receiptFilename: string;
}

export type AppRequest = NewPolicyRequest | EditCustomerDetailsRequest | AddDependentRequestType | PolicyUpgradeRequest | PolicyDowngradeRequest | MakePaymentRequest;

// --- REDUCER ACTION TYPE ---

export type Action =
  | { type: 'SET_INITIAL_DATA'; payload: { customers: Customer[]; requests: AppRequest[]; messages: ChatMessage[]; payments?: Payment[] } }
  | { type: 'ADD_REQUEST'; payload: AppRequest }
  | { type: 'UPDATE_REQUEST'; payload: AppRequest }
  | { type: 'SEND_MESSAGE'; payload: ChatMessage }
  | { type: 'MARK_MESSAGES_AS_READ'; payload: { chatPartnerId: number | 'admin'; currentUserId: number | 'admin' } }
  | { type: 'BULK_ADD_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_PAYMENT'; payload: Payment }
  | { type: 'SET_PAYMENTS'; payload: Payment[] };
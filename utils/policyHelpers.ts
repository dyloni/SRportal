import { Customer, Participant, FuneralPackage, MedicalPackage, CashBackAddon, AppRequest, RequestType, RequestStatus } from '../types';
import { MEDICAL_PACKAGE_DETAILS, CASH_BACK_DETAILS } from '../constants';

const packagePremiums: Record<string, { base?: number; perDependent?: number; perPerson?: number }> = {
    [FuneralPackage.STANDARD]: { base: 2.50, perDependent: 1.25 },
    [FuneralPackage.PREMIUM]: { base: 5.00, perDependent: 2.50 },
    [FuneralPackage.PLATINUM]: { base: 10.00, perDependent: 5.00 },
    [FuneralPackage.ALKAANE]: { perPerson: 18.00 },
};

// FIX: Define a more specific type for premium calculation to avoid broad Partial<Customer> type and casting issues.
interface PremiumCalculationInput {
    funeralPackage?: FuneralPackage;
    participants?: Partial<Participant>[];
}

// Calculates the monthly premium components for a customer
// FIX: Changed parameter type to be more specific and accommodate different shapes of customer/form data.
export const calculatePremiumComponents = (customer: PremiumCalculationInput): { policyPremium: number, addonPremium: number, totalPremium: number } => {
    let policyPremium = 0;
    let addonPremium = 0;
    const participants = customer.participants || [];
    const participantCount = participants.length;

    // --- Policy Premium Calculation ---
    if (customer.funeralPackage === FuneralPackage.MUSLIM_STANDARD) {
        const spouseCount = participants.filter(p => p.relationship === 'Spouse').length;
        const childrenAndDependentsCount = participants.filter(p => p.relationship === 'Child' || p.relationship === 'Other Dependent').length;
        
        if (participantCount > 0 && spouseCount > 0) {
            // Base price covers holder + 1 spouse
            policyPremium = 5.00; 
            // Add cost for additional spouses
            if (spouseCount > 1) {
                policyPremium += (spouseCount - 1) * 2.50;
            }
             // Add cost for children and other dependents
            policyPremium += childrenAndDependentsCount * 2.50;
        } else if (participantCount > 0) {
             // Holder only price
            policyPremium = 2.50;
            // Add cost for children and other dependents
            policyPremium += childrenAndDependentsCount * 2.50;
        }
    } else if (customer.funeralPackage && packagePremiums[customer.funeralPackage]) {
        const plan = packagePremiums[customer.funeralPackage];
        if (plan.perPerson) {
            // Per-person plans like Alkaane
            policyPremium = participantCount * plan.perPerson;
        } else if (plan.base && participantCount > 0) {
            // Base + per-dependent plans
            policyPremium = plan.base;
            const dependentCount = participantCount - 1;
            if (dependentCount > 0 && plan.perDependent) {
                policyPremium += dependentCount * plan.perDependent;
            }
        }
    }
    
    // --- Addon Premium Calculation ---
    // Medical Aid and Cash Back are now per-participant
    participants.forEach(p => {
        if (p.medicalPackage && MEDICAL_PACKAGE_DETAILS[p.medicalPackage]) {
            addonPremium += MEDICAL_PACKAGE_DETAILS[p.medicalPackage].price;
        }
        if (p.cashBackAddon && CASH_BACK_DETAILS[p.cashBackAddon]) {
            addonPremium += CASH_BACK_DETAILS[p.cashBackAddon].price;
        }
    });
    
    return {
        policyPremium,
        addonPremium,
        totalPremium: policyPremium + addonPremium
    };
};

// FIX: Changed parameter type to match calculatePremiumComponents.
export const calculatePremium = (customer: PremiumCalculationInput): number => {
    return calculatePremiumComponents(customer).totalPremium;
};


// Calculates the number of months between two dates
const monthDiff = (d1: Date, d2: Date): number => {
    let months;
    months = (d2.getFullYear() - d1.getFullYear()) * 12;
    months -= d1.getMonth();
    months += d2.getMonth();
    return months <= 0 ? 0 : months;
};

// Calculates outstanding balance and months due
export const calculateOutstandingBalance = (customer: Customer, requests: AppRequest[]) => {
    const approvedPayments = requests
        .filter(r => r.requestType === RequestType.MAKE_PAYMENT && r.customerId === customer.id && r.status === RequestStatus.APPROVED);
    
    const policyStartDate = new Date(customer.inceptionDate);
    const today = new Date();
    
    // Total months the policy should have been active (including the current month)
    const totalMonthsSinceStart = monthDiff(policyStartDate, today) + 1;
    
    // Number of payments successfully made
    const paymentsMadeCount = approvedPayments.length;
    
    const premium = calculatePremium(customer);
    const monthsDue = totalMonthsSinceStart - paymentsMadeCount;
    const balance = monthsDue * premium;

    return {
        balance: balance > 0 ? balance : 0,
        monthsDue: monthsDue > 0 ? monthsDue : 0,
        cappedMonths: monthsDue > 0 ? monthsDue : 0, // In this version, capped is same as actual
    };
};

// Determines the next payment period (e.g., "July 2024")
export const getNextPaymentPeriod = (customer: Customer, requests: AppRequest[]): string => {
    const approvedPayments = requests
        .filter(r => r.requestType === RequestType.MAKE_PAYMENT && r.customerId === customer.id && r.status === RequestStatus.APPROVED);
    
    const policyStartDate = new Date(customer.inceptionDate);
    const nextPaymentDate = new Date(policyStartDate);
    
    // Move date forward by the number of payments made
    nextPaymentDate.setMonth(policyStartDate.getMonth() + approvedPayments.length);
    
    return nextPaymentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
};

// Generates the unique 3-digit suffix for a participant
export const getParticipantSuffix = (participant: Participant, allParticipants: Participant[]): string => {
  if (participant.relationship === 'Self') {
    return '000';
  }

  // Sort by ID to ensure a stable order
  const ofSameType = allParticipants
    .filter(p => p.relationship === participant.relationship)
    .sort((a, b) => a.id - b.id);
  
  const index = ofSameType.findIndex((p) => p.id === participant.id);

  if (index === -1) return 'N/A';

  switch (participant.relationship) {
    case 'Spouse':
      return (101 + index).toString();
    case 'Child':
      return (201 + index).toString();
    case 'Other Dependent':
      return (301 + index).toString();
    default:
      return 'N/A';
  }
};
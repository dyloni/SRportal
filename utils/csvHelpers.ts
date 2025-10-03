// This file provides functions for exporting customer data to CSV and XLSX formats.
import { Customer, Agent, Participant, PolicyStatus, FuneralPackage, MedicalPackage, CashBackAddon, AppRequest } from '../types';
import * as XLSX from 'xlsx';
import { faker } from '@faker-js/faker';
import { calculatePremiumComponents } from './policyHelpers';
import { getEffectivePolicyStatus } from './statusHelpers';


const EXPORT_HEADERS = [
    'Policy Number', 'Relationship', 'First Name', 'Surname', 'Status', 'ID Number', 'Date of Birth', 'Gender', 'Phone', 'Email', 'Address', 'Postal Address',
    'Assigned Agent', 'Inception Date', 'Cover Date', 'Funeral Package', 'Medical Package', 'CashBack Addon'
];

// Helper to format a single participant into a row for export
const flattenParticipantToRow = (participant: Participant, customer: Customer, agentName: string, effectiveStatus: PolicyStatus) => {
    // The main policyholder's row contains all the policy-level info.
    // Dependent rows only contain their specific info + the linking Policy Number.
    const isHolder = participant.relationship === 'Self';
    return {
        'Policy Number': customer.policyNumber,
        'Relationship': participant.relationship,
        'First Name': participant.firstName,
        'Surname': participant.surname,
        'Status': isHolder ? effectiveStatus : '',
        'ID Number': participant.idNumber || '',
        'Date of Birth': participant.dateOfBirth ? new Date(participant.dateOfBirth).toLocaleDateString() : '',
        'Gender': participant.gender || '',
        'Phone': isHolder ? customer.phone : (participant.phone || ''),
        'Email': isHolder ? customer.email : (participant.email || ''),
        'Address': isHolder ? `${customer.streetAddress}, ${customer.town}`: '',
        'Postal Address': isHolder ? customer.postalAddress : '',
        'Assigned Agent': isHolder ? agentName : '',
        'Inception Date': isHolder ? new Date(customer.inceptionDate).toLocaleDateString() : '',
        'Cover Date': isHolder ? new Date(customer.coverDate).toLocaleDateString() : '',
        'Funeral Package': isHolder ? customer.funeralPackage : '',
        'Medical Package': participant.medicalPackage || '',
        'CashBack Addon': participant.cashBackAddon || '',
    };
};

const triggerDownload = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
};

// --- CORE EXPORT LOGIC ---

export const exportCustomersToFile = (customers: Customer[], agents: Agent[], requests: AppRequest[], format: 'csv' | 'xlsx') => {
    if (customers.length === 0) {
        alert('No customers to export.');
        return;
    }
    
    const allRows: any[] = [];
    customers.forEach(customer => {
        const agent = agents.find(a => a.id === customer.assignedAgentId);
        const agentName = agent ? `${agent.firstName} ${agent.surname}` : 'N/A';
        const effectiveStatus = getEffectivePolicyStatus(customer, requests);
        customer.participants.forEach(p => {
            allRows.push(flattenParticipantToRow(p, customer, agentName, effectiveStatus));
        });
    });

    const worksheet = XLSX.utils.json_to_sheet(allRows, { header: EXPORT_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    
    const filename = `customers_export.${format}`;
    XLSX.writeFile(workbook, filename);
};


// --- CORE IMPORT LOGIC ---

export const parseCustomersFile = (fileData: string | ArrayBuffer, agents: Agent[], existingCustomers: Customer[]): { customers: Customer[], errors: string[] } => {
    const workbook = XLSX.read(fileData, { type: 'binary', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const json: any[] = XLSX.utils.sheet_to_json(worksheet);

    const errors: string[] = [];
    const newCustomers: Customer[] = [];

    // Group rows by Policy Number
    const groupedByPolicy = json.reduce((acc, row) => {
        const policyNumber = row['Policy Number']?.toString().trim();
        if (policyNumber) {
            if (!acc[policyNumber]) {
                acc[policyNumber] = [];
            }
            acc[policyNumber].push(row);
        }
        return acc;
    }, {} as Record<string, any[]>);

    let customerIdCounter = Math.max(0, ...existingCustomers.map(c => c.id)) + 1;
    let participantIdCounter = Math.max(0, ...existingCustomers.flatMap(c => c.participants).map(p => p.id)) + 1;
    const allPolicyNumbers = new Set(existingCustomers.map(c => c.policyNumber));


    for (const policyNumberInFile in groupedByPolicy) {
        const rows = groupedByPolicy[policyNumberInFile];
        const holderRow = rows.find(r => r['Relationship'] === 'Self') || rows[0];
        
        const idNumber = holderRow['ID Number']?.toString().trim();

        if (!idNumber) {
            errors.push(`Policy group '${policyNumberInFile}' is missing an ID Number for the main holder. Skipping.`);
            continue;
        }

        const derivedPolicyNumber = idNumber.replace(/[^a-zA-Z0-9]/g, '');
        
        if (policyNumberInFile && policyNumberInFile !== derivedPolicyNumber) {
            errors.push(`Warning for group '${policyNumberInFile}': Policy number in file does not match the one derived from the ID number ('${derivedPolicyNumber}'). Using the derived number.`);
        }

        if (allPolicyNumbers.has(derivedPolicyNumber)) {
            errors.push(`Policy number ${derivedPolicyNumber} (from ID ${idNumber}) already exists. Skipping.`);
            continue;
        }

        const agent = agents.find(a => `${a.firstName} ${a.surname}` === holderRow['Assigned Agent']);
        const inceptionDate = holderRow['Inception Date'] instanceof Date ? holderRow['Inception Date'] : new Date();

        const customerBase: Partial<Customer> = {
            id: customerIdCounter++,
            uuid: faker.string.uuid(),
            policyNumber: derivedPolicyNumber,
            firstName: holderRow['First Name'],
            surname: holderRow['Surname'],
            status: holderRow['Status'] as PolicyStatus || PolicyStatus.ACTIVE,
            assignedAgentId: agent?.id,
            inceptionDate: inceptionDate.toISOString(),
            idNumber: holderRow['ID Number'],
            dateOfBirth: holderRow['Date of Birth'] instanceof Date ? holderRow['Date of Birth'].toISOString() : faker.date.birthdate({min: 18, max: 65, mode: 'age'}).toISOString(),
            gender: holderRow['Gender'] === 'Male' || holderRow['Gender'] === 'Female' ? holderRow['Gender'] : undefined,
            phone: holderRow['Phone'],
            email: holderRow['Email'],
            streetAddress: holderRow['Address']?.split(',')[0]?.trim(),
            town: holderRow['Address']?.split(',')[1]?.trim(),
            postalAddress: holderRow['Postal Address'],
            funeralPackage: holderRow['Funeral Package'] as FuneralPackage || FuneralPackage.STANDARD,
        };

        const participants: Participant[] = rows.map(row => ({
            id: participantIdCounter++,
            uuid: faker.string.uuid(),
            firstName: row['First Name'],
            surname: row['Surname'],
            relationship: row['Relationship'] || 'Other Dependent',
            dateOfBirth: row['Date of Birth'] instanceof Date ? row['Date of Birth'].toISOString() : '',
            idNumber: row['ID Number'],
            gender: row['Gender'] === 'Male' || row['Gender'] === 'Female' ? row['Gender'] : undefined,
            medicalPackage: row['Medical Package'] as MedicalPackage || MedicalPackage.NONE,
            cashBackAddon: row['CashBack Addon'] as CashBackAddon || CashBackAddon.NONE,
        }));

        const premiumComponents = calculatePremiumComponents({ ...customerBase, participants });
        const coverDate = new Date(customerBase.inceptionDate!);
        coverDate.setMonth(coverDate.getMonth() + 3);

        const newCustomer: Customer = {
            ...customerBase,
            participants,
            ...premiumComponents,
            coverDate: coverDate.toISOString(),
            premiumPeriod: '',
            latestReceiptDate: null,
            dateCreated: customerBase.inceptionDate!,
            lastUpdated: new Date().toISOString()
        } as Customer;

        newCustomers.push(newCustomer);
        allPolicyNumbers.add(derivedPolicyNumber);
    }
    
    return { customers: newCustomers, errors };
};


// --- TEMPLATE GENERATION ---

export const generateUploadTemplate = () => {
    const exampleId = '12-345678-A90';
    const examplePolicyNumber = exampleId.replace(/[^a-zA-Z0-9]/g, '');

    const exampleData = [
        {
            'Policy Number': examplePolicyNumber,
            'Relationship': 'Self',
            'First Name': 'John',
            'Surname': 'Doe',
            'Status': 'Active',
            'ID Number': exampleId,
            'Date of Birth': '1985-05-20',
            'Gender': 'Male',
            'Phone': '0777123456',
            'Email': 'john.doe@example.com',
            'Address': '123 Example St, Harare',
            'Postal Address': 'P.O. Box 456',
            'Assigned Agent': 'Tariro Moyo',
            'Inception Date': '2023-01-15',
            'Cover Date': '2023-04-15',
            'Funeral Package': FuneralPackage.PREMIUM,
            // FIX: Property 'BASIC' does not exist on type 'typeof MedicalPackage'.
            'Medical Package': MedicalPackage.ZIMHEALTH,
            // FIX: Property 'FIVE_YEAR' does not exist on type 'typeof CashBackAddon'.
            'CashBack Addon': CashBackAddon.CB1,
        },
        {
            'Policy Number': examplePolicyNumber,
            'Relationship': 'Spouse',
            'First Name': 'Jane',
            'Surname': 'Doe',
            'Date of Birth': '1988-11-10',
            'Gender': 'Female',
            // FIX: Property 'BASIC' does not exist on type 'typeof MedicalPackage'.
            'Medical Package': MedicalPackage.ZIMHEALTH,
            'CashBack Addon': CashBackAddon.NONE,
        },
        {
            'Policy Number': examplePolicyNumber,
            'Relationship': 'Child',
            'First Name': 'Peter',
            'Surname': 'Doe',
            'Date of Birth': '2015-02-25',
            'Medical Package': MedicalPackage.NONE,
            'CashBack Addon': CashBackAddon.NONE,
        }
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: EXPORT_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer Template');
    XLSX.writeFile(workbook, 'Customer_Upload_Template.xlsx');
};
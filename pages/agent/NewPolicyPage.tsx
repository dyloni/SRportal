import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import {
    FuneralPackage, MedicalPackage, CashBackAddon, PaymentMethod,
    Participant, Customer, PolicyStatus
} from '../../types';
import { FUNERAL_PACKAGE_DETAILS, MEDICAL_PACKAGE_DETAILS, CASH_BACK_DETAILS } from '../../constants';
import { calculatePremiumComponents } from '../../utils/policyHelpers';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { supabase } from '../../utils/supabase';

// Reusing form component style from other modals/pages
const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-base font-semibold text-brand-text-secondary mb-2">{label}</label>
        <input {...props} className={`block w-full px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink ${props.className}`} />
    </div>
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, ...props }) => (
    <div>
        <label className="block text-base font-semibold text-brand-text-secondary mb-2">{label}</label>
        <select {...props} className={`block w-full px-4 py-3 text-brand-text-primary bg-brand-surface border border-brand-border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-brand-pink focus:border-brand-pink ${props.className}`}>
            {children}
        </select>
    </div>
);

const NewPolicyPage: React.FC = () => {
    const { user } = useAuth();
    const { dispatchWithOffline } = useData();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<Omit<NewPolicyRequestData, 'cashBackAddon'>>({
        firstName: '',
        surname: '',
        idNumber: '',
        dateOfBirth: '',
        gender: 'Male',
        phone: '',
        email: '',
        streetAddress: '',
        town: '',
        postalAddress: '',
        participants: [],
        funeralPackage: FuneralPackage.STANDARD,
        paymentMethod: PaymentMethod.CASH,
        receiptFilename: '',
        idPhotoFilename: '',
    });

    // Sync policyholder details with the 'Self' participant
    useEffect(() => {
        const selfParticipantIndex = formData.participants.findIndex(p => p.relationship === 'Self');
        const holderMedicalPackage = selfParticipantIndex !== -1 ? formData.participants[selfParticipantIndex].medicalPackage : MedicalPackage.NONE;
        const holderCashBackAddon = selfParticipantIndex !== -1 ? formData.participants[selfParticipantIndex].cashBackAddon : CashBackAddon.NONE;

        const holderDetails: Omit<Participant, 'id' | 'uuid'> = {
            firstName: formData.firstName,
            surname: formData.surname,
            relationship: 'Self',
            dateOfBirth: formData.dateOfBirth,
            idNumber: formData.idNumber,
            gender: formData.gender,
            phone: formData.phone,
            email: formData.email,
            streetAddress: formData.streetAddress,
            town: formData.town,
            postalAddress: formData.postalAddress,
            medicalPackage: holderMedicalPackage,
            cashBackAddon: holderCashBackAddon,
        };
        
        const newParticipants = [...formData.participants];

        if (selfParticipantIndex !== -1) {
            newParticipants[selfParticipantIndex] = { ...newParticipants[selfParticipantIndex], ...holderDetails };
        } else {
            newParticipants.unshift(holderDetails);
        }

        if (JSON.stringify(newParticipants) !== JSON.stringify(formData.participants)) {
            setFormData(prev => ({ ...prev, participants: newParticipants }));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.firstName, formData.surname, formData.dateOfBirth, formData.idNumber, formData.gender, formData.phone, formData.email, formData.streetAddress, formData.town, formData.postalAddress]);


    const premiumComponents = useMemo(() => calculatePremiumComponents(formData), [formData]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addParticipant = () => {
        setFormData(prev => ({
            ...prev,
            participants: [
                ...prev.participants,
                { 
                    firstName: '', 
                    surname: prev.surname,
                    relationship: 'Child', 
                    dateOfBirth: '',
                    idNumber: '',
                    gender: 'Male',
                    phone: '',
                    email: '',
                    streetAddress: prev.streetAddress, // pre-fill address
                    town: prev.town,
                    postalAddress: prev.postalAddress,
                    medicalPackage: MedicalPackage.NONE,
                    cashBackAddon: CashBackAddon.NONE,
                }
            ]
        }));
    };

    const removeParticipant = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            participants: prev.participants.filter((_, index) => index !== indexToRemove),
        }));
    };

    const handleParticipantChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newParticipants = [...prev.participants];
            const participantToUpdate = { ...newParticipants[index] };
            (participantToUpdate as any)[name] = value;
            newParticipants[index] = participantToUpdate;
            return { ...prev, participants: newParticipants };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const { policyPremium, addonPremium, totalPremium } = premiumComponents;

        try {
            const { data: maxIdData } = await supabase
                .from('customers')
                .select('id')
                .order('id', { ascending: false })
                .limit(1)
                .maybeSingle();

            const nextId = maxIdData ? maxIdData.id + 1 : 1;
            const year = new Date().getFullYear().toString().slice(-2);
            const policyNumber = `SR${year}${String(nextId).padStart(5, '0')}`;

            const { data: existingPolicy } = await supabase
                .from('customers')
                .select('policy_number')
                .eq('policy_number', policyNumber)
                .maybeSingle();

            if (existingPolicy) {
                alert('Policy number conflict. Please try again.');
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            const coverDate = new Date();
            coverDate.setDate(coverDate.getDate() + 30);
            const coverDateStr = coverDate.toISOString().split('T')[0];

            const participantsWithIds = formData.participants.map((p, idx) => ({
                ...p,
                id: nextId * 1000 + idx,
                uuid: `${nextId}-${idx}-${Date.now()}`
            }));

            const newCustomer: Customer = {
                id: nextId,
                uuid: `cust-${nextId}-${Date.now()}`,
                policyNumber,
                firstName: formData.firstName,
                surname: formData.surname,
                inceptionDate: today,
                coverDate: coverDateStr,
                status: PolicyStatus.ACTIVE,
                assignedAgentId: user.id,
                idNumber: formData.idNumber,
                dateOfBirth: formData.dateOfBirth,
                gender: formData.gender,
                phone: formData.phone,
                email: formData.email,
                streetAddress: formData.streetAddress,
                town: formData.town,
                postalAddress: formData.postalAddress,
                funeralPackage: formData.funeralPackage,
                participants: participantsWithIds,
                policyPremium,
                addonPremium,
                totalPremium,
                premiumPeriod: today,
                latestReceiptDate: today,
                dateCreated: today,
                lastUpdated: today
            };

            const { error } = await supabase
                .from('customers')
                .insert({
                    id: newCustomer.id,
                    uuid: newCustomer.uuid,
                    policy_number: newCustomer.policyNumber,
                    first_name: newCustomer.firstName,
                    surname: newCustomer.surname,
                    inception_date: newCustomer.inceptionDate,
                    cover_date: newCustomer.coverDate,
                    status: newCustomer.status,
                    assigned_agent_id: newCustomer.assignedAgentId,
                    id_number: newCustomer.idNumber,
                    date_of_birth: newCustomer.dateOfBirth,
                    gender: newCustomer.gender,
                    phone: newCustomer.phone,
                    email: newCustomer.email,
                    street_address: newCustomer.streetAddress,
                    town: newCustomer.town,
                    postal_address: newCustomer.postalAddress,
                    funeral_package: newCustomer.funeralPackage,
                    participants: newCustomer.participants,
                    policy_premium: newCustomer.policyPremium,
                    addon_premium: newCustomer.addonPremium,
                    total_premium: newCustomer.totalPremium,
                    premium_period: newCustomer.premiumPeriod,
                    latest_receipt_date: newCustomer.latestReceiptDate,
                    date_created: newCustomer.dateCreated,
                    last_updated: newCustomer.lastUpdated
                });

            if (error) throw error;

            alert(`Policy ${policyNumber} created successfully! The customer is now active in the system.`);
            navigate('/customers');
        } catch (error) {
            console.error('Error creating policy:', error);
            alert('Error creating policy. Please try again.');
        }
    };

    const selectedPackageDetails = FUNERAL_PACKAGE_DETAILS[formData.funeralPackage];
    
    // Logic for dependent medical aid options
    const holderMedicalPackage = formData.participants.find(p => p.relationship === 'Self')?.medicalPackage || MedicalPackage.NONE;
    const holderMedicalPrice = MEDICAL_PACKAGE_DETAILS[holderMedicalPackage].price;
    const dependentMedicalOptions = Object.values(MedicalPackage).filter(
        pkg => MEDICAL_PACKAGE_DETAILS[pkg].price <= holderMedicalPrice
    );
    
    // Logic for dependent cash back options
    const holderCashBackAddon = formData.participants.find(p => p.relationship === 'Self')?.cashBackAddon || CashBackAddon.NONE;
    const holderCashBackPrice = CASH_BACK_DETAILS[holderCashBackAddon].price;
    const dependentCashBackOptions = Object.values(CashBackAddon).filter(
        addon => CASH_BACK_DETAILS[addon].price <= holderCashBackPrice
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-28">
            <h2 className="text-3xl font-extrabold text-brand-text-primary">Create New Policy Application</h2>
            
            <Card title="Step 1: Policyholder Personal Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="First Name(s)" name="firstName" value={formData.firstName} onChange={handleChange} required />
                    <FormInput label="Surname" name="surname" value={formData.surname} onChange={handleChange} required />
                    <FormInput label="National ID Number" name="idNumber" value={formData.idNumber} onChange={handleChange} required />
                    <FormInput label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
                    <FormSelect label="Gender" name="gender" value={formData.gender} onChange={handleChange} required>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </FormSelect>
                    <FormInput label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                    <FormInput label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} />
                    <FormInput label="Street Address" name="streetAddress" value={formData.streetAddress} onChange={handleChange} required />
                    <FormInput label="Town/City" name="town" value={formData.town} onChange={handleChange} required />
                    <FormInput label="Postal Address" name="postalAddress" value={formData.postalAddress} onChange={handleChange} required />
                </div>
            </Card>

            <Card title="Step 2: Participants on Policy">
                <div className="space-y-4">
                    {formData.participants.map((p, index) => (
                        <div key={index} className="p-4 border border-brand-border rounded-lg">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    {p.relationship === 'Self' ? (
                                        <h4 className="font-semibold text-lg text-brand-text-primary">{p.firstName} {p.surname} (Policyholder)</h4>
                                    ) : (
                                        <h4 className="font-semibold text-lg text-brand-text-primary">{p.relationship || 'New Participant'}</h4>
                                    )}
                                    {p.relationship !== 'Self' && (
                                        <Button type="button" variant="secondary" onClick={() => removeParticipant(index)}>Remove</Button>
                                    )}
                                </div>
                                {p.relationship !== 'Self' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormInput label="First Name(s)" name="firstName" value={p.firstName || ''} onChange={e => handleParticipantChange(index, e)} required />
                                        <FormInput label="Surname" name="surname" value={p.surname || ''} onChange={e => handleParticipantChange(index, e)} required />
                                        <FormSelect label="Relationship" name="relationship" value={p.relationship} onChange={e => handleParticipantChange(index, e)} required>
                                            <option value="Spouse">Spouse</option>
                                            <option value="Child">Child</option>
                                            <option value="Other Dependent">Other Dependent</option>
                                        </FormSelect>
                                        <FormInput label="Date of Birth" name="dateOfBirth" type="date" value={p.dateOfBirth || ''} onChange={e => handleParticipantChange(index, e)} required />
                                        <FormInput label="National ID Number" name="idNumber" value={p.idNumber || ''} onChange={e => handleParticipantChange(index, e)} />
                                        <FormSelect label="Gender" name="gender" value={p.gender || 'Male'} onChange={e => handleParticipantChange(index, e)}>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </FormSelect>
                                        <FormInput label="Phone Number" name="phone" type="tel" value={p.phone || ''} onChange={e => handleParticipantChange(index, e)} />
                                        <FormInput label="Email Address" name="email" type="email" value={p.email || ''} onChange={e => handleParticipantChange(index, e)} />
                                        <FormInput label="Street Address" name="streetAddress" value={p.streetAddress || ''} onChange={e => handleParticipantChange(index, e)} className="md:col-span-2" />
                                        <FormInput label="Town/City" name="town" value={p.town || ''} onChange={e => handleParticipantChange(index, e)} />
                                        <FormInput label="Postal Address" name="postalAddress" value={p.postalAddress || ''} onChange={e => handleParticipantChange(index, e)} />
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormSelect 
                                    label="Medical Aid Package" 
                                    name="medicalPackage" 
                                    value={p.medicalPackage || MedicalPackage.NONE} 
                                    onChange={e => handleParticipantChange(index, e)}
                                >
                                    {(p.relationship === 'Self' ? Object.values(MedicalPackage) : dependentMedicalOptions).map(pkg => (
                                        <option key={pkg} value={pkg}>{MEDICAL_PACKAGE_DETAILS[pkg].name} (+${MEDICAL_PACKAGE_DETAILS[pkg].price.toFixed(2)})</option>
                                    ))}
                                </FormSelect>
                                 <FormSelect 
                                    label="Cash Back Add-on" 
                                    name="cashBackAddon" 
                                    value={p.cashBackAddon || CashBackAddon.NONE} 
                                    onChange={e => handleParticipantChange(index, e)}
                                >
                                    {(p.relationship === 'Self' ? Object.values(CashBackAddon) : dependentCashBackOptions).map(addon => (
                                        <option key={addon} value={addon}>{CASH_BACK_DETAILS[addon].name} (+${CASH_BACK_DETAILS[addon].price.toFixed(2)})</option>
                                    ))}
                                </FormSelect>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <Button type="button" variant="secondary" onClick={addParticipant} className="mt-4 w-full">Add Another Participant</Button>
            </Card>
            
            <Card title="Step 3: Policy & Payment Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <FormSelect label="Funeral Package" name="funeralPackage" value={formData.funeralPackage} onChange={handleChange}>
                            {Object.values(FuneralPackage).map(p => <option key={p} value={p}>{p}</option>)}
                        </FormSelect>
                        {selectedPackageDetails && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-brand-text-secondary space-y-1">
                                <p>{selectedPackageDetails.description}</p>
                                {selectedPackageDetails.rules && <p className="font-semibold">Rules: {selectedPackageDetails.rules.join(' ')}</p>}
                            </div>
                        )}
                    </div>
                     <div>
                        <FormSelect label="Initial Payment Method" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                            {Object.values(PaymentMethod).map(p => <option key={p} value={p}>{p}</option>)}
                        </FormSelect>
                    </div>
                     <FormInput label="Payment Receipt Filename/Ref" name="receiptFilename" value={formData.receiptFilename} onChange={handleChange} required />
                     <FormInput label="Policyholder ID Photo Filename" name="idPhotoFilename" value={formData.idPhotoFilename} onChange={handleChange} required className="md:col-span-2" />
                </div>
            </Card>

            <div className="flex justify-end pt-4">
                <Button type="submit" className="w-full md:w-auto" disabled={premiumComponents.totalPremium <= 0}>
                    Create Policy
                </Button>
            </div>

            <div className="fixed bottom-6 right-6 z-50">
                <div className="bg-brand-pink text-white rounded-full shadow-lg px-6 py-4 flex flex-col items-center justify-center text-center leading-tight">
                    <span className="font-bold text-2xl">${premiumComponents.totalPremium.toFixed(2)}</span>
                    <span className="text-xs opacity-90">/ month</span>
                </div>
            </div>
        </form>
    );
};

export default NewPolicyPage;
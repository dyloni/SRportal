import React, { useState } from 'react';
import { Customer, FuneralPackage, MedicalPackage, CashBackAddon } from '../../types';
import Button from '../ui/Button';
import { FUNERAL_PACKAGE_DETAILS, MEDICAL_PACKAGE_DETAILS, CASH_BACK_DETAILS } from '../../constants';
import { calculatePremiumComponents } from '../../utils/policyHelpers';
import { supabase } from '../../utils/supabase';

interface PolicyAdjustmentModalProps {
    customer: Customer;
    onClose: () => void;
}

const PolicyAdjustmentModal: React.FC<PolicyAdjustmentModalProps> = ({ customer, onClose }) => {
    const [selectedFuneralPackage, setSelectedFuneralPackage] = useState<FuneralPackage>(customer.funeralPackage);
    const [participantAddons, setParticipantAddons] = useState(
        customer.participants.map(p => ({
            participantId: p.id,
            participantName: `${p.firstName} ${p.surname}`,
            medicalPackage: p.medicalPackage || MedicalPackage.NONE,
            cashBackAddon: p.cashBackAddon || CashBackAddon.NONE,
        }))
    );

    const currentPremium = calculatePremiumComponents(customer);
    const newPremium = calculatePremiumComponents({
        funeralPackage: selectedFuneralPackage,
        participants: customer.participants.map((p, idx) => ({
            ...p,
            medicalPackage: participantAddons[idx].medicalPackage,
            cashBackAddon: participantAddons[idx].cashBackAddon,
        })),
    });

    const handleUpdateParticipantAddon = (index: number, field: 'medicalPackage' | 'cashBackAddon', value: string) => {
        const updated = [...participantAddons];
        updated[index] = { ...updated[index], [field]: value };
        setParticipantAddons(updated);
    };

    const handleSubmit = async () => {
        try {
            const updatedParticipants = customer.participants.map((p, idx) => ({
                ...p,
                medicalPackage: participantAddons[idx].medicalPackage,
                cashBackAddon: participantAddons[idx].cashBackAddon,
            }));

            const { error } = await supabase
                .from('customers')
                .update({
                    funeral_package: selectedFuneralPackage,
                    participants: updatedParticipants,
                    policy_premium: newPremium.policyPremium,
                    addon_premium: newPremium.addonPremium,
                    total_premium: newPremium.totalPremium,
                    last_updated: new Date().toISOString(),
                })
                .eq('id', customer.id);

            if (error) throw error;

            alert('Policy adjusted successfully!');
            onClose();
        } catch (error) {
            console.error('Error adjusting policy:', error);
            alert('Error adjusting policy. Please try again.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold text-brand-text-primary mb-4">
                    Adjust Policy for {`${customer.firstName} ${customer.surname}`}
                </h3>

                <div className="space-y-6">
                    <div>
                        <h4 className="text-lg font-semibold text-brand-text-primary mb-3">Funeral Package</h4>
                        <div className="space-y-3">
                            {Object.values(FuneralPackage).map(pkg => (
                                <label key={pkg} className="flex items-start p-3 border border-brand-border rounded-lg cursor-pointer hover:bg-brand-pink/5">
                                    <input
                                        type="radio"
                                        name="funeralPackage"
                                        value={pkg}
                                        checked={selectedFuneralPackage === pkg}
                                        onChange={(e) => setSelectedFuneralPackage(e.target.value as FuneralPackage)}
                                        className="mt-1 mr-3"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-brand-text-primary">{pkg}</div>
                                        <div className="text-sm text-brand-text-secondary mt-1">
                                            {FUNERAL_PACKAGE_DETAILS[pkg]?.description}
                                        </div>
                                        {FUNERAL_PACKAGE_DETAILS[pkg]?.rules && (
                                            <div className="text-xs text-brand-text-secondary mt-2">
                                                {FUNERAL_PACKAGE_DETAILS[pkg].rules.join(' ')}
                                            </div>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-brand-text-primary mb-3">Add-ons per Participant</h4>
                        <div className="space-y-4">
                            {participantAddons.map((addon, idx) => (
                                <div key={addon.participantId} className="p-4 border border-brand-border rounded-lg bg-gray-50">
                                    <div className="font-semibold text-brand-text-primary mb-3">{addon.participantName}</div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                                                Medical Package
                                            </label>
                                            <select
                                                value={addon.medicalPackage}
                                                onChange={(e) => handleUpdateParticipantAddon(idx, 'medicalPackage', e.target.value)}
                                                className="block w-full px-3 py-2 text-brand-text-primary bg-white border border-brand-border rounded-lg"
                                            >
                                                {Object.values(MedicalPackage).map(pkg => (
                                                    <option key={pkg} value={pkg}>
                                                        {MEDICAL_PACKAGE_DETAILS[pkg].name} (${MEDICAL_PACKAGE_DETAILS[pkg].price}/month)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                                                Cash Back Add-on
                                            </label>
                                            <select
                                                value={addon.cashBackAddon}
                                                onChange={(e) => handleUpdateParticipantAddon(idx, 'cashBackAddon', e.target.value)}
                                                className="block w-full px-3 py-2 text-brand-text-primary bg-white border border-brand-border rounded-lg"
                                            >
                                                {Object.values(CashBackAddon).map(cb => (
                                                    <option key={cb} value={cb}>
                                                        {CASH_BACK_DETAILS[cb].name} (${CASH_BACK_DETAILS[cb].price}/month)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-brand-pink/10 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-brand-text-secondary">Current Monthly Premium:</span>
                            <span className="text-lg font-bold text-brand-text-primary">${currentPremium.totalPremium.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-brand-text-secondary">New Monthly Premium:</span>
                            <span className="text-xl font-bold text-brand-pink">${newPremium.totalPremium.toFixed(2)}</span>
                        </div>
                        {newPremium.totalPremium !== currentPremium.totalPremium && (
                            <div className="text-sm text-brand-text-secondary mt-2">
                                Change: {newPremium.totalPremium > currentPremium.totalPremium ? '+' : ''}
                                ${(newPremium.totalPremium - currentPremium.totalPremium).toFixed(2)}/month
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-6 mt-6 space-x-2 border-t border-brand-border">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit}>Update Policy</Button>
                </div>
            </div>
        </div>
    );
};

export default PolicyAdjustmentModal;

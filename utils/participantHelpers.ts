import { Participant, FuneralPackage } from '../types';

export const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};

export const isChildRelationship = (relationship: string): boolean => {
    return ['Child', 'Stepchild', 'Grandchild', 'Sibling'].includes(relationship);
};

export const validateChildAge = (participant: Participant): { valid: boolean; message?: string } => {
    if (!isChildRelationship(participant.relationship)) {
        return { valid: true };
    }

    const age = calculateAge(participant.dateOfBirth);

    if (age <= 18) {
        return { valid: true };
    }

    if (age <= 23 && participant.isStudent) {
        return { valid: true };
    }

    if (age <= 23 && !participant.isStudent) {
        return {
            valid: false,
            message: 'Children aged 19-23 must be students with valid school ID'
        };
    }

    return {
        valid: false,
        message: 'Children cannot be older than 23 years'
    };
};

export const validateDependentAge = (participant: Participant): { valid: boolean; message?: string } => {
    if (participant.relationship === 'Self' || participant.relationship === 'Spouse') {
        return { valid: true };
    }

    if (isChildRelationship(participant.relationship)) {
        return validateChildAge(participant);
    }

    const age = calculateAge(participant.dateOfBirth);

    if (age < 18) {
        return {
            valid: false,
            message: 'Other dependents must be at least 18 years old'
        };
    }

    return { valid: true };
};

export const countChildDependents = (participants: Participant[]): number => {
    return participants.filter(p => isChildRelationship(p.relationship)).length;
};

export const validateMaxChildren = (participants: Participant[]): { valid: boolean; message?: string } => {
    const childCount = countChildDependents(participants);

    if (childCount > 4) {
        return {
            valid: false,
            message: 'Maximum of 4 biological/step/grand children or siblings allowed'
        };
    }

    return { valid: true };
};

export const calculateAgeSurcharge = (participant: Participant, funeralPackage: FuneralPackage): number => {
    if (participant.relationship === 'Self') {
        return 0;
    }

    const age = calculateAge(participant.dateOfBirth);

    if (age <= 64) {
        return 0;
    }

    if (funeralPackage === FuneralPackage.PREMIUM) {
        return 0;
    }

    return 2.50;
};

export const validateParticipant = (participant: Participant, allParticipants: Participant[]): {
    valid: boolean;
    messages: string[]
} => {
    const messages: string[] = [];

    const ageValidation = validateDependentAge(participant);
    if (!ageValidation.valid && ageValidation.message) {
        messages.push(ageValidation.message);
    }

    const maxChildrenValidation = validateMaxChildren(allParticipants);
    if (!maxChildrenValidation.valid && maxChildrenValidation.message) {
        messages.push(maxChildrenValidation.message);
    }

    return {
        valid: messages.length === 0,
        messages
    };
};

export const getFamilyStructureLabel = (participants: Participant[]): string => {
    const self = participants.find(p => p.relationship === 'Self');
    const spouses = participants.filter(p => p.relationship === 'Spouse');
    const children = participants.filter(p => p.relationship === 'Child');
    const stepchildren = participants.filter(p => p.relationship === 'Stepchild');
    const grandchildren = participants.filter(p => p.relationship === 'Grandchild');
    const siblings = participants.filter(p => p.relationship === 'Sibling');
    const grandparents = participants.filter(p => p.relationship === 'Grandparent');

    if (siblings.length > 0 && !self) {
        return 'Child-Headed Family';
    }

    if (grandparents.length > 0 || grandchildren.length > 0) {
        return 'Grandparent-Headed Family';
    }

    if (stepchildren.length > 0) {
        return 'Blended Family';
    }

    if (spouses.length === 0 && children.length > 0) {
        return 'Single Parent Family';
    }

    if (spouses.length > 0 && children.length > 0) {
        return 'Nuclear Family';
    }

    return 'Individual/Couple';
};

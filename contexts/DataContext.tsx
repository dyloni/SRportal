import React, { createContext, useReducer, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { faker } from '@faker-js/faker';
import { AppRequest, Customer, ChatMessage, Agent, Admin, Action, RequestType, RequestStatus, PolicyStatus, Participant } from '../types';
import { AGENTS, ADMINS, CUSTOMERS, REQUESTS, MESSAGES } from '../constants';
import * as db from '../utils/db';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { calculatePremiumComponents } from '../utils/policyHelpers';

interface AppState {
    agents: Agent[];
    admins: Admin[];
    customers: Customer[];
    requests: AppRequest[];
    messages: ChatMessage[];
}

interface DataContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    dispatchWithOffline: (action: Action) => void;
}

// Create a single BroadcastChannel for the entire app
const channel = new BroadcastChannel('stone-river-state-sync');

const initialState: AppState = {
    agents: AGENTS,
    admins: ADMINS,
    customers: CUSTOMERS,
    requests: REQUESTS,
    messages: MESSAGES,
};

const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_INITIAL_DATA':
            return {
                ...state,
                customers: action.payload.customers,
                requests: action.payload.requests,
                messages: action.payload.messages,
            };
        case 'ADD_REQUEST':
             if (state.requests.some(r => r.id === action.payload.id)) {
                return state; // Prevent duplicates from broadcast
            }
            return {
                ...state,
                requests: [...state.requests, action.payload],
            };
        case 'UPDATE_REQUEST': {
            const updatedRequest = action.payload;

            // If a new policy request is approved, create a new customer from the request data
            if (updatedRequest.requestType === RequestType.NEW_POLICY && updatedRequest.status === RequestStatus.APPROVED) {
                
                const originalRequest = state.requests.find(r => r.id === updatedRequest.id);
                if (originalRequest?.requestType !== RequestType.NEW_POLICY) {
                    return { ...state, requests: state.requests.map(req => req.id === updatedRequest.id ? updatedRequest : req) };
                }

                const newCustomerData = originalRequest.customerData;
                const idNumber = newCustomerData.idNumber;
                const policyNumber = idNumber.replace(/[^a-zA-Z0-9]/g, '');

                if (state.customers.some(c => c.policyNumber === policyNumber)) {
                    const rejectedRequest = { ...updatedRequest, status: RequestStatus.REJECTED, adminNotes: `Rejected: Policy number ${policyNumber} already exists.` };
                     return { ...state, requests: state.requests.map(req => req.id === rejectedRequest.id ? rejectedRequest : req) };
                }

                const newCustomerId = Math.max(0, ...state.customers.map(c => c.id)) + 1;
                const newParticipantStartId = Math.max(0, ...state.customers.flatMap(c => c.participants).map(p => p.id)) + 1;
                const inceptionDate = new Date(originalRequest.createdAt);
                const coverDate = new Date(inceptionDate);
                coverDate.setMonth(coverDate.getMonth() + 3);

                const premiumComponents = calculatePremiumComponents({ ...newCustomerData });

                const newCustomer: Customer = {
                    id: newCustomerId,
                    uuid: faker.string.uuid(),
                    policyNumber,
                    firstName: newCustomerData.firstName,
                    surname: newCustomerData.surname,
                    inceptionDate: inceptionDate.toISOString(),
                    coverDate: coverDate.toISOString(),
                    status: PolicyStatus.ACTIVE,
                    assignedAgentId: originalRequest.agentId,
                    idNumber: newCustomerData.idNumber,
                    dateOfBirth: newCustomerData.dateOfBirth,
                    gender: newCustomerData.gender,
                    phone: newCustomerData.phone,
                    email: newCustomerData.email,
                    streetAddress: newCustomerData.streetAddress,
                    town: newCustomerData.town,
                    postalAddress: newCustomerData.postalAddress,
                    funeralPackage: newCustomerData.funeralPackage,
                    // FIX: Removed `cashBackAddon` property. This property does not exist on the `Customer` type. Add-ons are handled per-participant.
                    participants: newCustomerData.participants.map((p, index): Participant => ({
                        ...p,
                        id: newParticipantStartId + index,
                        uuid: faker.string.uuid(),
                    })),
                    policyPremium: premiumComponents.policyPremium,
                    addonPremium: premiumComponents.addonPremium,
                    totalPremium: premiumComponents.totalPremium,
                    premiumPeriod: inceptionDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
                    latestReceiptDate: inceptionDate.toISOString(),
                    dateCreated: inceptionDate.toISOString(),
                    lastUpdated: new Date().toISOString(),
                };

                return {
                    ...state,
                    customers: [...state.customers, newCustomer],
                    requests: state.requests.map(req =>
                        req.id === updatedRequest.id ? updatedRequest : req
                    ),
                };
            }

            return {
                ...state,
                requests: state.requests.map(req =>
                    req.id === action.payload.id ? action.payload : req
                ),
            };
        }
        case 'SEND_MESSAGE':
            if (state.messages.some(m => m.id === action.payload.id)) {
                return state;
            }
            return {
                ...state,
                messages: [...state.messages, action.payload],
            };
        case 'MARK_MESSAGES_AS_READ': {
            const { chatPartnerId, currentUserId } = action.payload;
            return {
                ...state,
                messages: state.messages.map(m =>
                    m.senderId === chatPartnerId && m.recipientId === currentUserId && m.status === 'unread'
                        ? { ...m, status: 'read' }
                        : m
                ),
            };
        }
        case 'BULK_ADD_CUSTOMERS': {
            // Prevent duplicates from broadcast
            const existingIds = new Set(state.customers.map(c => c.id));
            const newCustomers = action.payload.filter(c => !existingIds.has(c.id));
            if (newCustomers.length === 0) return state;

            return {
                ...state,
                customers: [...state.customers, ...newCustomers],
            };
        }
        default:
            return state;
    }
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, internalDispatch] = useReducer(dataReducer, initialState);
    const isOnline = useOnlineStatus();

    // Give this tab a unique ID to prevent it from acting on its own messages
    const tabId = useRef(Date.now() + Math.random()).current;

    useEffect(() => {
        // Listen for messages from other tabs
        const handleMessage = (event: MessageEvent) => {
            const { action, sourceId } = event.data;
            // If the message is from another tab, dispatch the action locally
            if (sourceId !== tabId) {
                console.log('Received action from another tab:', action);
                internalDispatch(action);
            }
        };

        channel.addEventListener('message', handleMessage);

        // Cleanup
        return () => {
            channel.removeEventListener('message', handleMessage);
        };
    }, [tabId]);

    // Create a dispatch function that also broadcasts the action
    const dispatch = useCallback((action: Action) => {
        // Dispatch locally first for immediate UI update
        internalDispatch(action);
        // Broadcast the action to other tabs
        channel.postMessage({ action, sourceId: tabId });
    }, [tabId]);


    const dispatchWithOffline = (action: Action) => {
        if (isOnline) {
            console.log('Online, dispatching action immediately:', action);
            dispatch(action);
        } else {
            console.log('Offline, adding action to queue:', action);
            db.addToQueue(action);
        }
    };

    return (
        <DataContext.Provider value={{ state, dispatch, dispatchWithOffline }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};

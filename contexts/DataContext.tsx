import React, { createContext, useReducer, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { faker } from '@faker-js/faker';
import { AppRequest, Customer, ChatMessage, Agent, Admin, Action, RequestType, RequestStatus, PolicyStatus, Participant, Payment } from '../types';
import { AGENTS, ADMINS, CUSTOMERS, REQUESTS, MESSAGES } from '../constants';
import * as db from '../utils/db';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { calculatePremiumComponents } from '../utils/policyHelpers';
import { supabaseService } from '../services/supabaseService';

interface AppState {
    agents: Agent[];
    admins: Admin[];
    customers: Customer[];
    requests: AppRequest[];
    messages: ChatMessage[];
    payments: Payment[];
}

interface DataContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    dispatchWithOffline: (action: Action) => void;
    refreshData: () => Promise<void>;
}

// Create a single BroadcastChannel for the entire app
const channel = new BroadcastChannel('stone-river-state-sync');

const initialState: AppState = {
    agents: AGENTS,
    admins: ADMINS,
    customers: CUSTOMERS,
    requests: REQUESTS,
    messages: MESSAGES,
    payments: [],
};

const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_INITIAL_DATA':
            return {
                ...state,
                customers: action.payload.customers,
                requests: action.payload.requests,
                messages: action.payload.messages,
                payments: action.payload.payments || state.payments,
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

            // If a payment request is approved, update customer status to ACTIVE
            if (updatedRequest.requestType === RequestType.MAKE_PAYMENT && updatedRequest.status === RequestStatus.APPROVED) {
                const originalRequest = state.requests.find(r => r.id === updatedRequest.id);
                if (originalRequest?.requestType !== RequestType.MAKE_PAYMENT) {
                    return { ...state, requests: state.requests.map(req => req.id === updatedRequest.id ? updatedRequest : req) };
                }

                const customerId = originalRequest.customerId;
                const updatedCustomers = state.customers.map(customer => {
                    if (customer.id === customerId) {
                        return {
                            ...customer,
                            status: PolicyStatus.ACTIVE,
                            latestReceiptDate: new Date().toISOString(),
                            premiumPeriod: originalRequest.paymentPeriod,
                            lastUpdated: new Date().toISOString(),
                        };
                    }
                    return customer;
                });

                return {
                    ...state,
                    customers: updatedCustomers,
                    requests: state.requests.map(req => req.id === updatedRequest.id ? updatedRequest : req),
                };
            }

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
        case 'ADD_PAYMENT':
            if (state.payments.some(p => p.id === action.payload.id)) {
                return state;
            }
            return {
                ...state,
                payments: [...state.payments, action.payload],
            };
        case 'SET_PAYMENTS':
            return {
                ...state,
                payments: action.payload,
            };
        default:
            return state;
    }
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, internalDispatch] = useReducer(dataReducer, initialState);
    const isOnline = useOnlineStatus();
    const isInitialized = useRef(false);
    const stateRef = useRef(state);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // Give this tab a unique ID to prevent it from acting on its own messages
    const tabId = useRef(Date.now() + Math.random()).current;

    const refreshData = useCallback(async () => {
        try {
            const [customers, requests, messages, payments] = await Promise.all([
                supabaseService.loadCustomers(),
                supabaseService.loadRequests(),
                supabaseService.loadMessages(),
                supabaseService.loadPayments(),
            ]);

            internalDispatch({
                type: 'SET_INITIAL_DATA',
                payload: { customers, requests, messages, payments },
            });
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }, []);

    useEffect(() => {
        const initializeData = async () => {
            if (isInitialized.current) return;
            isInitialized.current = true;

            try {
                const [customers, requests, messages, payments] = await Promise.all([
                    supabaseService.loadCustomers(),
                    supabaseService.loadRequests(),
                    supabaseService.loadMessages(),
                    supabaseService.loadPayments(),
                ]);

                if (customers.length > 0 || requests.length > 0 || messages.length > 0 || payments.length > 0) {
                    internalDispatch({
                        type: 'SET_INITIAL_DATA',
                        payload: { customers, requests, messages, payments },
                    });
                } else {
                    await Promise.all([
                        ...CUSTOMERS.map(c => supabaseService.saveCustomer(c)),
                        ...REQUESTS.map(r => supabaseService.saveRequest(r)),
                        ...MESSAGES.map(m => supabaseService.saveMessage(m)),
                    ]);

                    internalDispatch({
                        type: 'SET_INITIAL_DATA',
                        payload: { customers: CUSTOMERS, requests: REQUESTS, messages: MESSAGES, payments: [] },
                    });
                }
            } catch (error) {
                console.error('Error initializing data:', error);
            }
        };

        initializeData();
    }, []);

    useEffect(() => {
        supabaseService.subscribeToCustomers(
            (customer) => {
                console.log('Real-time: Customer inserted', customer);
                internalDispatch({
                    type: 'BULK_ADD_CUSTOMERS',
                    payload: [customer],
                });
            },
            (customer) => {
                console.log('Real-time: Customer updated', customer);
                internalDispatch({
                    type: 'SET_INITIAL_DATA',
                    payload: {
                        customers: stateRef.current.customers.map(c => c.id === customer.id ? customer : c),
                        requests: stateRef.current.requests,
                        messages: stateRef.current.messages,
                        payments: stateRef.current.payments,
                    },
                });
            },
            (id) => {
                console.log('Real-time: Customer deleted', id);
                internalDispatch({
                    type: 'SET_INITIAL_DATA',
                    payload: {
                        customers: stateRef.current.customers.filter(c => c.id !== id),
                        requests: stateRef.current.requests,
                        messages: stateRef.current.messages,
                        payments: stateRef.current.payments,
                    },
                });
            }
        );

        supabaseService.subscribeToRequests(
            (request) => {
                console.log('Real-time: Request inserted', request);
                internalDispatch({
                    type: 'ADD_REQUEST',
                    payload: request,
                });
            },
            (request) => {
                console.log('Real-time: Request updated', request);
                internalDispatch({
                    type: 'UPDATE_REQUEST',
                    payload: request,
                });
            },
            (id) => {
                console.log('Real-time: Request deleted', id);
                internalDispatch({
                    type: 'SET_INITIAL_DATA',
                    payload: {
                        customers: stateRef.current.customers,
                        requests: stateRef.current.requests.filter(r => r.id !== id),
                        messages: stateRef.current.messages,
                        payments: stateRef.current.payments,
                    },
                });
            }
        );

        supabaseService.subscribeToMessages(
            (message) => {
                console.log('Real-time: Message inserted', message);
                internalDispatch({
                    type: 'SEND_MESSAGE',
                    payload: message,
                });
            },
            (message) => {
                console.log('Real-time: Message updated', message);
                internalDispatch({
                    type: 'SET_INITIAL_DATA',
                    payload: {
                        customers: stateRef.current.customers,
                        requests: stateRef.current.requests,
                        messages: stateRef.current.messages.map(m => m.id === message.id ? message : m),
                        payments: stateRef.current.payments,
                    },
                });
            },
            (id) => {
                console.log('Real-time: Message deleted', id);
                internalDispatch({
                    type: 'SET_INITIAL_DATA',
                    payload: {
                        customers: stateRef.current.customers,
                        requests: stateRef.current.requests,
                        messages: stateRef.current.messages.filter(m => m.id !== id),
                        payments: stateRef.current.payments,
                    },
                });
            }
        );

        supabaseService.subscribeToPayments(
            (payment) => {
                console.log('Real-time: Payment inserted', payment);
                internalDispatch({
                    type: 'ADD_PAYMENT',
                    payload: payment,
                });
            },
            (payment) => {
                console.log('Real-time: Payment updated', payment);
                internalDispatch({
                    type: 'SET_PAYMENTS',
                    payload: stateRef.current.payments.map(p => p.id === payment.id ? payment : p),
                });
            },
            (id) => {
                console.log('Real-time: Payment deleted', id);
                internalDispatch({
                    type: 'SET_PAYMENTS',
                    payload: stateRef.current.payments.filter(p => p.id !== id),
                });
            }
        );

        return () => {
            supabaseService.unsubscribeAll();
        };
    }, []);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const { action, sourceId } = event.data;
            if (sourceId !== tabId) {
                console.log('Received action from another tab:', action);
                internalDispatch(action);
            }
        };

        channel.addEventListener('message', handleMessage);

        return () => {
            channel.removeEventListener('message', handleMessage);
        };
    }, [tabId]);

    const dispatch = useCallback(async (action: Action) => {
        internalDispatch(action);
        channel.postMessage({ action, sourceId: tabId });

        try {
            switch (action.type) {
                case 'ADD_REQUEST':
                    await supabaseService.saveRequest(action.payload);
                    break;
                case 'UPDATE_REQUEST':
                    await supabaseService.saveRequest(action.payload);
                    if (action.payload.requestType === RequestType.NEW_POLICY && action.payload.status === RequestStatus.APPROVED) {
                        const newCustomer = state.customers.find(c => !CUSTOMERS.some(ic => ic.id === c.id));
                        if (newCustomer) {
                            await supabaseService.saveCustomer(newCustomer);
                        }
                    }
                    if (action.payload.requestType === RequestType.MAKE_PAYMENT && action.payload.status === RequestStatus.APPROVED) {
                        const updatedCustomer = stateRef.current.customers.find(c => c.id === action.payload.customerId);
                        if (updatedCustomer) {
                            await supabaseService.saveCustomer(updatedCustomer);
                        }
                    }
                    break;
                case 'SEND_MESSAGE':
                    await supabaseService.saveMessage(action.payload);
                    break;
                case 'MARK_MESSAGES_AS_READ': {
                    const { chatPartnerId, currentUserId } = action.payload;
                    const messagesToUpdate = state.messages.filter(
                        m => m.senderId === chatPartnerId && m.recipientId === currentUserId && m.status === 'unread'
                    );
                    await Promise.all(
                        messagesToUpdate.map(m => supabaseService.saveMessage({ ...m, status: 'read' }))
                    );
                    break;
                }
                case 'BULK_ADD_CUSTOMERS':
                    await Promise.all(action.payload.map(c => supabaseService.saveCustomer(c)));
                    break;
            }
        } catch (error) {
            console.error('Error saving to Supabase:', error);
        }
    }, [state, tabId]);

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
        <DataContext.Provider value={{ state, dispatch, dispatchWithOffline, refreshData }}>
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

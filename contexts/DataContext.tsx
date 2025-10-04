import React, { createContext, useReducer, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { faker } from '@faker-js/faker';
import { Claim, Customer, ChatMessage, Agent, Admin, Action } from '../types';
import { AGENTS, ADMINS, CUSTOMERS, MESSAGES } from '../constants';
import * as db from '../utils/db';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { calculatePremiumComponents } from '../utils/policyHelpers';
import { supabaseService } from '../services/supabaseService';

interface AppState {
    agents: Agent[];
    admins: Admin[];
    customers: Customer[];
    claims: Claim[];
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
    claims: [],
    messages: MESSAGES,
};

const dataReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_INITIAL_DATA':
            return {
                ...state,
                customers: action.payload.customers,
                claims: action.payload.claims,
                messages: action.payload.messages,
            };
        case 'ADD_CLAIM':
             if (state.claims.some(c => c.id === action.payload.id)) {
                return state;
            }
            return {
                ...state,
                claims: [...state.claims, action.payload],
            };
        case 'UPDATE_CLAIM':
            return {
                ...state,
                claims: state.claims.map(c =>
                    c.id === action.payload.id ? action.payload : c
                ),
            };
        case 'UPDATE_CUSTOMER':
            return {
                ...state,
                customers: state.customers.map(c =>
                    c.id === action.payload.id ? action.payload : c
                ),
            };
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
    const isInitialized = useRef(false);
    const stateRef = useRef(state);

    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // Give this tab a unique ID to prevent it from acting on its own messages
    const tabId = useRef(Date.now() + Math.random()).current;

    useEffect(() => {
        const initializeData = async () => {
            if (isInitialized.current) return;
            isInitialized.current = true;

            try {
                const [customers, claims, messages] = await Promise.all([
                    supabaseService.loadCustomers(),
                    supabaseService.loadClaims(),
                    supabaseService.loadMessages(),
                ]);

                if (customers.length > 0 || messages.length > 0) {
                    internalDispatch({
                        type: 'SET_INITIAL_DATA',
                        payload: { customers, claims, messages },
                    });
                } else {
                    await Promise.all([
                        ...CUSTOMERS.map(c => supabaseService.saveCustomer(c)),
                        ...MESSAGES.map(m => supabaseService.saveMessage(m)),
                    ]);

                    internalDispatch({
                        type: 'SET_INITIAL_DATA',
                        payload: { customers: CUSTOMERS, claims: [], messages: MESSAGES },
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
                    },
                });
            }
        );

        supabaseService.subscribeToClaims(
            (claim) => {
                console.log('Real-time: Claim inserted', claim);
                internalDispatch({
                    type: 'ADD_CLAIM',
                    payload: claim,
                });
            },
            (claim) => {
                console.log('Real-time: Claim updated', claim);
                internalDispatch({
                    type: 'UPDATE_CLAIM',
                    payload: claim,
                });
            },
            (id) => {
                console.log('Real-time: Claim deleted', id);
                internalDispatch({
                    type: 'SET_INITIAL_DATA',
                    payload: {
                        customers: stateRef.current.customers,
                        claims: stateRef.current.claims.filter(c => c.id !== id),
                        messages: stateRef.current.messages,
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
                    },
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
                case 'ADD_CLAIM':
                    await supabaseService.saveClaim(action.payload);
                    break;
                case 'UPDATE_CLAIM':
                    await supabaseService.saveClaim(action.payload);
                    break;
                case 'UPDATE_CUSTOMER':
                    await supabaseService.saveCustomer(action.payload);
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

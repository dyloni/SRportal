import { supabase } from '../utils/supabase';
import { Customer, AppRequest, ChatMessage, Agent, Payment } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

export class SupabaseService {
  private customersChannel: RealtimeChannel | null = null;
  private requestsChannel: RealtimeChannel | null = null;
  private messagesChannel: RealtimeChannel | null = null;
  private paymentsChannel: RealtimeChannel | null = null;

  async loadAgents(): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error loading agents:', error);
      return [];
    }

    return (data || []).map((agent: any) => ({
      id: agent.id,
      firstName: agent.first_name,
      surname: agent.surname,
      email: agent.email,
      profilePictureUrl: agent.profile_picture_url,
    }));
  }

  async loadCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error loading customers:', error);
      return [];
    }

    return (data || []).map(this.transformCustomerFromDB);
  }

  async loadRequests(): Promise<AppRequest[]> {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error loading requests:', error);
      return [];
    }

    return (data || []).map(this.transformRequestFromDB);
  }

  async loadMessages(): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error loading messages:', error);
      return [];
    }

    return (data || []).map(this.transformMessageFromDB);
  }

  async loadPayments(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error loading payments:', error);
      return [];
    }

    return data || [];
  }

  async saveCustomer(customer: Customer): Promise<void> {
    const dbCustomer = this.transformCustomerToDB(customer);

    const { error } = await supabase
      .from('customers')
      .upsert(dbCustomer, { onConflict: 'id' });

    if (error) {
      console.error('Error saving customer:', error);
      throw error;
    }
  }

  async saveRequest(request: AppRequest): Promise<void> {
    const dbRequest = this.transformRequestToDB(request);

    const { error } = await supabase
      .from('requests')
      .upsert(dbRequest, { onConflict: 'id' });

    if (error) {
      console.error('Error saving request:', error);
      throw error;
    }
  }

  async saveMessage(message: ChatMessage): Promise<void> {
    const dbMessage = this.transformMessageToDB(message);

    const { error } = await supabase
      .from('messages')
      .upsert(dbMessage, { onConflict: 'id' });

    if (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  subscribeToCustomers(
    onInsert: (customer: Customer) => void,
    onUpdate: (customer: Customer) => void,
    onDelete: (id: number) => void
  ): void {
    this.customersChannel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'customers' },
        (payload) => {
          const customer = this.transformCustomerFromDB(payload.new);
          onInsert(customer);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'customers' },
        (payload) => {
          const customer = this.transformCustomerFromDB(payload.new);
          onUpdate(customer);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'customers' },
        (payload) => {
          onDelete(payload.old.id);
        }
      )
      .subscribe();
  }

  subscribeToRequests(
    onInsert: (request: AppRequest) => void,
    onUpdate: (request: AppRequest) => void,
    onDelete: (id: number) => void
  ): void {
    this.requestsChannel = supabase
      .channel('requests-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'requests' },
        (payload) => {
          const request = this.transformRequestFromDB(payload.new);
          onInsert(request);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests' },
        (payload) => {
          const request = this.transformRequestFromDB(payload.new);
          onUpdate(request);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'requests' },
        (payload) => {
          onDelete(payload.old.id);
        }
      )
      .subscribe();
  }

  subscribeToMessages(
    onInsert: (message: ChatMessage) => void,
    onUpdate: (message: ChatMessage) => void,
    onDelete: (id: number | string) => void
  ): void {
    this.messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const message = this.transformMessageFromDB(payload.new);
          onInsert(message);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          const message = this.transformMessageFromDB(payload.new);
          onUpdate(message);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        (payload) => {
          onDelete(payload.old.id);
        }
      )
      .subscribe();
  }

  subscribeToPayments(
    onInsert: (payment: Payment) => void,
    onUpdate: (payment: Payment) => void,
    onDelete: (id: number) => void
  ): void {
    this.paymentsChannel = supabase
      .channel('payments-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments' },
        (payload) => {
          onInsert(payload.new as Payment);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'payments' },
        (payload) => {
          onUpdate(payload.new as Payment);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'payments' },
        (payload) => {
          onDelete(payload.old.id);
        }
      )
      .subscribe();
  }

  unsubscribeAll(): void {
    if (this.customersChannel) {
      supabase.removeChannel(this.customersChannel);
      this.customersChannel = null;
    }
    if (this.requestsChannel) {
      supabase.removeChannel(this.requestsChannel);
      this.requestsChannel = null;
    }
    if (this.messagesChannel) {
      supabase.removeChannel(this.messagesChannel);
      this.messagesChannel = null;
    }
    if (this.paymentsChannel) {
      supabase.removeChannel(this.paymentsChannel);
      this.paymentsChannel = null;
    }
  }

  private transformCustomerFromDB(row: any): Customer {
    return {
      id: row.id,
      uuid: row.uuid,
      policyNumber: row.policy_number,
      firstName: row.first_name,
      surname: row.surname,
      inceptionDate: row.inception_date,
      coverDate: row.cover_date,
      status: row.status,
      assignedAgentId: row.assigned_agent_id,
      idNumber: row.id_number,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      phone: row.phone,
      email: row.email,
      streetAddress: row.street_address,
      town: row.town,
      postalAddress: row.postal_address,
      funeralPackage: row.funeral_package,
      participants: row.participants || [],
      policyPremium: parseFloat(row.policy_premium || 0),
      addonPremium: parseFloat(row.addon_premium || 0),
      totalPremium: parseFloat(row.total_premium || 0),
      premiumPeriod: row.premium_period,
      latestReceiptDate: row.latest_receipt_date,
      dateCreated: row.date_created,
      lastUpdated: row.last_updated,
    };
  }

  private transformCustomerToDB(customer: Customer): any {
    return {
      id: customer.id,
      uuid: customer.uuid,
      policy_number: customer.policyNumber,
      first_name: customer.firstName,
      surname: customer.surname,
      inception_date: customer.inceptionDate,
      cover_date: customer.coverDate,
      status: customer.status,
      assigned_agent_id: customer.assignedAgentId,
      id_number: customer.idNumber,
      date_of_birth: customer.dateOfBirth,
      gender: customer.gender,
      phone: customer.phone,
      email: customer.email,
      street_address: customer.streetAddress,
      town: customer.town,
      postal_address: customer.postalAddress,
      funeral_package: customer.funeralPackage,
      participants: customer.participants,
      policy_premium: customer.policyPremium,
      addon_premium: customer.addonPremium,
      total_premium: customer.totalPremium,
      premium_period: customer.premiumPeriod,
      latest_receipt_date: customer.latestReceiptDate,
      date_created: customer.dateCreated,
      last_updated: customer.lastUpdated,
    };
  }

  private transformRequestFromDB(row: any): AppRequest {
    const baseRequest = {
      id: row.id,
      agentId: row.agent_id,
      status: row.status,
      createdAt: row.created_at_app,
      adminNotes: row.admin_notes,
    };

    switch (row.request_type) {
      case 'New Policy':
        return {
          ...baseRequest,
          requestType: row.request_type,
          customerData: row.customer_data,
          idPhotoFilename: row.id_photo_filename,
          paymentAmount: parseFloat(row.payment_amount || 0),
          paymentMethod: row.payment_method,
          receiptFilename: row.receipt_filename,
        } as any;
      case 'Edit Customer Details':
        return {
          ...baseRequest,
          requestType: row.request_type,
          customerId: row.customer_id,
          oldValues: row.old_values,
          newValues: row.new_values,
        } as any;
      case 'Add Dependent':
        return {
          ...baseRequest,
          requestType: row.request_type,
          customerId: row.customer_id,
          dependentData: row.dependent_data,
        } as any;
      case 'Policy Upgrade':
      case 'Policy Downgrade':
        return {
          ...baseRequest,
          requestType: row.request_type,
          customerId: row.customer_id,
          details: row.details,
        } as any;
      case 'Make Payment':
        return {
          ...baseRequest,
          requestType: row.request_type,
          customerId: row.customer_id,
          paymentAmount: parseFloat(row.payment_amount || 0),
          paymentType: row.payment_type,
          paymentMethod: row.payment_method,
          paymentPeriod: row.payment_period,
          receiptFilename: row.receipt_filename,
        } as any;
      default:
        throw new Error(`Unknown request type: ${row.request_type}`);
    }
  }

  private transformRequestToDB(request: AppRequest): any {
    const baseRequest = {
      id: request.id,
      agent_id: request.agentId,
      status: request.status,
      request_type: request.requestType,
      admin_notes: request.adminNotes,
      created_at_app: request.createdAt,
    };

    switch (request.requestType) {
      case 'New Policy':
        return {
          ...baseRequest,
          customer_data: request.customerData,
          id_photo_filename: request.idPhotoFilename,
          payment_amount: request.paymentAmount,
          payment_method: request.paymentMethod,
          receipt_filename: request.receiptFilename,
        };
      case 'Edit Customer Details':
        return {
          ...baseRequest,
          customer_id: request.customerId,
          old_values: request.oldValues,
          new_values: request.newValues,
        };
      case 'Add Dependent':
        return {
          ...baseRequest,
          customer_id: request.customerId,
          dependent_data: request.dependentData,
        };
      case 'Policy Upgrade':
      case 'Policy Downgrade':
        return {
          ...baseRequest,
          customer_id: request.customerId,
          details: request.details,
        };
      case 'Make Payment':
        return {
          ...baseRequest,
          customer_id: request.customerId,
          payment_amount: request.paymentAmount,
          payment_type: request.paymentType,
          payment_method: request.paymentMethod,
          payment_period: request.paymentPeriod,
          receipt_filename: request.receiptFilename,
        };
    }
  }

  private transformMessageFromDB(row: any): ChatMessage {
    return {
      id: row.id,
      senderId: this.parseUserId(row.sender_id),
      senderName: row.sender_name,
      recipientId: this.parseUserId(row.recipient_id),
      text: row.text,
      timestamp: row.timestamp,
      status: row.status,
    };
  }

  private transformMessageToDB(message: ChatMessage): any {
    return {
      id: message.id,
      sender_id: String(message.senderId),
      sender_name: message.senderName,
      recipient_id: String(message.recipientId),
      text: message.text,
      timestamp: message.timestamp,
      status: message.status,
    };
  }

  private parseUserId(id: string): number | 'admin' | 'broadcast' {
    if (id === 'admin' || id === 'broadcast') return id;
    return parseInt(id, 10);
  }
}

export const supabaseService = new SupabaseService();

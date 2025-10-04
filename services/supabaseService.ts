import { supabase } from '../utils/supabase';
import { Customer, Claim, ChatMessage, Agent } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

export class SupabaseService {
  private customersChannel: RealtimeChannel | null = null;
  private claimsChannel: RealtimeChannel | null = null;
  private messagesChannel: RealtimeChannel | null = null;

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

  async loadClaims(): Promise<Claim[]> {
    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error loading claims:', error);
      return [];
    }

    return (data || []).map(this.transformClaimFromDB);
  }

  async loadMessages(): Promise<ChatMessage[]> {
    const { data, error} = await supabase
      .from('messages')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error loading messages:', error);
      return [];
    }

    return (data || []).map(this.transformMessageFromDB);
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

  async saveClaim(claim: Claim): Promise<void> {
    const dbClaim = this.transformClaimToDB(claim);

    const { error } = await supabase
      .from('claims')
      .upsert(dbClaim, { onConflict: 'id' });

    if (error) {
      console.error('Error saving claim:', error);
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

  subscribeToClaims(
    onInsert: (claim: Claim) => void,
    onUpdate: (claim: Claim) => void,
    onDelete: (id: number) => void
  ): void {
    this.claimsChannel = supabase
      .channel('claims-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'claims' },
        (payload) => {
          const claim = this.transformClaimFromDB(payload.new);
          onInsert(claim);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'claims' },
        (payload) => {
          const claim = this.transformClaimFromDB(payload.new);
          onUpdate(claim);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'claims' },
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

  unsubscribeAll(): void {
    if (this.customersChannel) {
      supabase.removeChannel(this.customersChannel);
      this.customersChannel = null;
    }
    if (this.claimsChannel) {
      supabase.removeChannel(this.claimsChannel);
      this.claimsChannel = null;
    }
    if (this.messagesChannel) {
      supabase.removeChannel(this.messagesChannel);
      this.messagesChannel = null;
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

  private transformClaimFromDB(row: any): Claim {
    return {
      id: row.id,
      customerId: row.customer_id,
      policyNumber: row.policy_number,
      customerName: row.customer_name,
      deceasedName: row.deceased_name,
      deceasedParticipantId: row.deceased_participant_id,
      dateOfDeath: row.date_of_death,
      claimAmount: parseFloat(row.claim_amount || 0),
      status: row.status,
      filedBy: this.parseUserId(row.filed_by),
      filedByName: row.filed_by_name,
      filedDate: row.filed_date,
      approvedDate: row.approved_date,
      paidDate: row.paid_date,
      notes: row.notes,
      deathCertificateFilename: row.death_certificate_filename,
    };
  }

  private transformClaimToDB(claim: Claim): any {
    return {
      id: claim.id,
      customer_id: claim.customerId,
      policy_number: claim.policyNumber,
      customer_name: claim.customerName,
      deceased_name: claim.deceasedName,
      deceased_participant_id: claim.deceasedParticipantId,
      date_of_death: claim.dateOfDeath,
      claim_amount: claim.claimAmount,
      status: claim.status,
      filed_by: String(claim.filedBy),
      filed_by_name: claim.filedByName,
      filed_date: claim.filedDate,
      approved_date: claim.approvedDate,
      paid_date: claim.paidDate,
      notes: claim.notes,
      death_certificate_filename: claim.deathCertificateFilename,
    };
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

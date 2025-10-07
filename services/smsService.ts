const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface SMSPayload {
  api_id: string;
  api_password: string;
  sms_type: 'P' | 'T';
  encoding: 'T' | 'U' | 'FS' | 'UFS';
  sender_id: string;
  phonenumber: string;
  textmessage: string;
  templateid?: string | null;
  V1?: string | null;
  V2?: string | null;
  V3?: string | null;
  V4?: string | null;
  V5?: string | null;
}

export interface SMSResponse {
  message_id?: number;
  status: 'S' | 'F';
  remarks: string;
}

export interface DeliveryStatusResponse {
  message_id: number;
  PhoneNumber: string;
  SMSMessage: string;
  MessageType: string;
  MessageLength: number;
  MessageParts: number;
  ClientCost: number;
  DLRStatus: string;
  SMSID: string;
  ErrorCode: number;
  ErrorDescription: string;
  SentDateUTC: string;
  Remarks: string;
}

export const sendSMS = async (
  phoneNumber: string,
  message: string,
  senderId: string = 'STONERIVER',
  smsType: 'P' | 'T' = 'T',
  encoding: 'T' | 'U' | 'FS' | 'UFS' = 'T'
): Promise<SMSResponse> => {
  const payload = {
    phoneNumber,
    message,
    senderId,
    smsType,
    encoding,
  };

  console.log('Sending SMS via edge function:', { phoneNumber, senderId, smsType });

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data: SMSResponse = await response.json();
    console.log('SMS Response:', data);
    return data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to SMS service. Please check your internet connection or try again later.');
    }
    throw error;
  }
};

export const sendBulkSMS = async (
  phoneNumbers: string[],
  message: string,
  senderId: string = 'STONERIVER',
  smsType: 'P' | 'T' = 'T',
  encoding: 'T' | 'U' | 'FS' | 'UFS' = 'T'
): Promise<{ successful: number; failed: number; results: Array<{ phone: string; status: string; remarks: string }> }> => {
  const results = [];
  let successful = 0;
  let failed = 0;

  for (const phoneNumber of phoneNumbers) {
    try {
      const response = await sendSMS(phoneNumber, message, senderId, smsType, encoding);
      if (response.status === 'S') {
        successful++;
        results.push({
          phone: phoneNumber,
          status: 'success',
          remarks: response.remarks,
        });
      } else {
        failed++;
        results.push({
          phone: phoneNumber,
          status: 'failed',
          remarks: response.remarks,
        });
      }
    } catch (error) {
      failed++;
      results.push({
        phone: phoneNumber,
        status: 'error',
        remarks: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { successful, failed, results };
};

export const getDeliveryStatus = async (messageId: number): Promise<DeliveryStatusResponse> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-sms-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ messageId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DeliveryStatusResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting delivery status:', error);
    throw error;
  }
};

export const checkBalance = async (): Promise<{ BalanceAmount: number; CurrenceCode: string }> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/check-sms-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking balance:', error);
    throw error;
  }
};

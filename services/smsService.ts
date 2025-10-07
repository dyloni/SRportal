const BLUEDOT_API_URL = 'https://rest.bluedotsms.com/api';
const API_ID = import.meta.env.VITE_BLUEDOT_API_ID;
const API_PASSWORD = import.meta.env.VITE_BLUEDOT_API_PASSWORD;

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
  const payload: SMSPayload = {
    api_id: API_ID,
    api_password: API_PASSWORD,
    sms_type: smsType,
    encoding: encoding,
    sender_id: senderId,
    phonenumber: phoneNumber,
    textmessage: message,
    templateid: null,
    V1: null,
    V2: null,
    V3: null,
    V4: null,
    V5: null,
  };

  try {
    const response = await fetch(`${BLUEDOT_API_URL}/SendSMS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SMSResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending SMS:', error);
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
    const response = await fetch(`${BLUEDOT_API_URL}/GetDeliveryStatus?message_id=${messageId}`, {
      method: 'GET',
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
    const response = await fetch(
      `${BLUEDOT_API_URL}/CheckBalance?api_id=${API_ID}&api_password=${API_PASSWORD}`,
      {
        method: 'GET',
      }
    );

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

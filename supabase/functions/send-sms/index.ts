import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BLUEDOT_API_URL = 'https://rest.bluedotsms.com/api';

interface SendSMSRequest {
  phoneNumber: string;
  message: string;
  senderId?: string;
  smsType?: 'P' | 'T';
  encoding?: 'T' | 'U' | 'FS' | 'UFS';
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { phoneNumber, message, senderId = 'STONERIVER', smsType = 'T', encoding = 'T' }: SendSMSRequest = await req.json();

    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ status: 'F', remarks: 'Phone number and message are required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const API_ID = Deno.env.get('BLUEDOT_API_ID');
    const API_PASSWORD = Deno.env.get('BLUEDOT_API_PASSWORD');

    if (!API_ID || !API_PASSWORD) {
      return new Response(
        JSON.stringify({ status: 'F', remarks: 'SMS service not configured' }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const payload = {
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

    console.log('Sending SMS to BlueDot API:', { phoneNumber, senderId, smsType });

    const response = await fetch(`${BLUEDOT_API_URL}/SendSMS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('BlueDot API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BlueDot API Error:', errorText);
      return new Response(
        JSON.stringify({ status: 'F', remarks: `API Error: ${errorText}` }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const data = await response.json();
    console.log('BlueDot API Success:', data);

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in send-sms function:', error);
    return new Response(
      JSON.stringify({
        status: 'F',
        remarks: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

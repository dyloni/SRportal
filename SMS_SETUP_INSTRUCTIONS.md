# SMS Integration Setup Instructions

The SMS integration requires deploying a Supabase Edge Function to securely handle API requests to BlueDot SMS.

## Step 1: Set Environment Variables in Supabase

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Add the following secrets:
   - `BLUEDOT_API_ID` = `API30911939623`
   - `BLUEDOT_API_PASSWORD` = `ESEPPdmLpE`

## Step 2: Deploy the Edge Function

### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI if you haven't:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref hnfpdvomcxuxfnfiowxr
   ```

4. Deploy the function:
   ```bash
   supabase functions deploy send-sms --no-verify-jwt
   ```

### Option B: Using Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to **Edge Functions**
3. Click **Create a new function**
4. Name it `send-sms`
5. Copy the contents of `supabase/functions/send-sms/index.ts`
6. Paste into the function editor
7. Deploy the function
8. Make sure to **disable JWT verification** for this function

## Step 3: Test the Integration

After deploying:

1. Refresh your application
2. Go to the Admin Dashboard or Admin Customers page
3. Click "Send Bulk SMS"
4. Select customers and send a test message

## Function Location

The edge function code is located at:
```
supabase/functions/send-sms/index.ts
```

## Troubleshooting

### "Failed to fetch" error
- Ensure the edge function is deployed successfully
- Check that environment variables are set correctly in Supabase
- Verify the function URL is accessible

### "SMS service not configured" error
- The edge function environment variables are not set
- Go back to Step 1 and add the secrets

### No SMS received
- Check Supabase Edge Function logs for errors
- Verify phone numbers are in correct format (263...)
- Ensure BlueDot SMS account has sufficient balance

## Checking Logs

View edge function logs in Supabase:
1. Go to **Edge Functions** in your Supabase dashboard
2. Click on the `send-sms` function
3. View the **Logs** tab

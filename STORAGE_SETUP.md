# Storage Bucket Setup

## Payment Receipts Storage

To enable receipt uploads, you need to create a storage bucket in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the sidebar
3. Click **New bucket**
4. Create a bucket with the following settings:
   - **Name**: `payment-receipts`
   - **Public bucket**: ✅ Enable (checked)
   - **File size limit**: 50 MB (recommended)
   - **Allowed MIME types**: Leave empty or specify: `image/*,application/pdf`

5. Once created, the bucket will automatically work with the application

## Storage Policies

The storage policies should be automatically configured to allow anonymous access for:
- Uploading receipts
- Reading/viewing receipts
- Updating receipts
- Deleting receipts

If you need to manually configure policies:

1. Go to **Storage** > **Policies**
2. Select the `payment-receipts` bucket
3. Add the following policies:

```sql
-- Allow anonymous users to upload
CREATE POLICY "Allow anon to upload payment receipts"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'payment-receipts');

-- Allow anonymous users to read
CREATE POLICY "Allow anon to read payment receipts"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'payment-receipts');
```

## Note

The storage bucket cannot be created via migrations due to permission restrictions. It must be created through the Supabase dashboard.

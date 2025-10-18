-- Add profile_picture_url column to contacts table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add index for better performance on profile_picture_url
CREATE INDEX IF NOT EXISTS idx_contacts_profile_picture_url ON public.contacts(profile_picture_url);

-- Add index for better performance on lead_status
CREATE INDEX IF NOT EXISTS idx_contacts_lead_status ON public.contacts(lead_status);

-- Add index for better performance on last_contacted_at
CREATE INDEX IF NOT EXISTS idx_contacts_last_contacted ON public.contacts(last_contacted_at);

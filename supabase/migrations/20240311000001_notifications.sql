-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    icon TEXT,
    color TEXT,
    source TEXT,
    type TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);
-- Turn on RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- Policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notifications" ON public.notifications FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR
UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
-- Optional: insert some onboarding notification logic later, but for now we just want the table.
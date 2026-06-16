CREATE TABLE public.community_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read messages
CREATE POLICY "Allow anyone to read messages" ON public.community_messages
    FOR SELECT USING (true);

-- Allow anyone to insert messages
CREATE POLICY "Allow anyone to insert messages" ON public.community_messages
    FOR INSERT WITH CHECK (true);

-- Enable real-time updates for the community_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;

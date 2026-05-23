-- Migration to enable Row Level Security (RLS) on exposed tables to resolve security advisory notices

ALTER TABLE public.budget ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_category_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_bill ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personalization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

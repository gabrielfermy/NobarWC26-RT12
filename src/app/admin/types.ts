export interface Match {
  id: string;
  team_a: string;
  team_b: string;
  match_time: string;
  stage: string;
  score_a: number | null;
  score_b: number | null;
  status: string;
  stadium: string;
  is_nobar?: boolean;
  nobar_location?: string;
  nobar_pre_minutes?: number;
}

export interface Profile {
  id: string;
  name: string;
  phone_number: string;
  role: string;
  created_at: string;
  auth_user_id?: string | null;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  payment_status: string;
  payment_method: string;
  transaction_reference: string | null;
  created_at: string;
  profiles: {
    name: string;
    phone_number: string;
  } | null;
  predictions?: any[];
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  receipt_url: string | null;
  created_at: string;
  profiles: {
    name: string;
    phone_number: string;
  } | null;
}

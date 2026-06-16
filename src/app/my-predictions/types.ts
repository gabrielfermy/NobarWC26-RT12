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
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_score_a: number;
  predicted_score_b: number;
  transaction_id: string;
  created_at: string;
  matches: Match;
  transactions: {
    payment_status: string;
    payment_method: string;
    transaction_reference: string;
  } | null;
}

export interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  receipt_url: string | null;
  created_at: string;
}

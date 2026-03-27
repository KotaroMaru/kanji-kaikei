export interface Group {
  id: string;
  name: string;
  amount: number;
  created_at: string;
}

export interface Member {
  id: string;
  name: string;
  group_id: string | null;
  custom_amount: number | null;
  is_attending: boolean;
  is_paid: boolean;
  created_at: string;
  groups?: Group | null;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paid_by: string;
  created_at: string;
}

export interface MemberWithGroup extends Member {
  groups: Group | null;
}

export interface KOLFormData {
  contactPerson: string;
  kolName: string;
  profitShare: string;
  guaranteedMinimum: string;
  bonusAmount: string;
  bonusThreshold: string;
  fanOffer: string;
  endDate: string;
  sendHandle: '是' | '否';
}

export interface Preset {
  id: string;
  name: string;
  data: Partial<KOLFormData>;
}

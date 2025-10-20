export interface KOLFormData {
  contactPerson: string;
  kolName: string;
  profitShare: string;
  guaranteedMinimum: string;
  bonusAmount: string;
  performanceThreshold: string; // Renamed from bonusThreshold
  profitShareBonus: string; // New field
  fanOffer: string;
  endDate: string;
  sendHandle: '是' | '否';
}

export interface Preset {
  id: string;
  name: string;
  data: Partial<KOLFormData>;
}

export interface TemplatePreset {
  id: string;
  name: string;
  template: string;
}

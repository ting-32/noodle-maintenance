export interface Equipment {
  id: string;
  name: string;
  itemIds?: string[];
  order?: number;
}

export interface MaintenanceCategory {
  id: string;
  name: string;
  color?: string;
}

export interface MaintenanceItem {
  id: string;
  name: string;
  category: string;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  equipmentName: string;
  category: string;
  itemId: string;
  itemName: string;
  date: string;
  status: 'completed' | 'pending' | 'issue';
  notes: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  vendorName?: string;
  vendorPhone?: string;
}

export interface AddLogPayload {
  equipmentId: string;
  equipmentName: string;
  category: string;
  vendor?: string;
  phone?: string;
  vendorName?: string;
  vendorPhone?: string;
  itemIds: string[];
  itemName: string;
  cost: number;
  timeSpent: number;
  notes: string;
  beforePhotoBase64?: string;
  afterPhotoBase64?: string;
}


export interface RequestItemLine {
  itemName: string;
  quantity: number;
  unitType: string;
}

export interface RequestModel {
  id: number;
  roomNumber: string;
  roomListId: number;
  status: string;
  createdAt: string; // ISO Date String
  employeeId: number;
  name: string;      // "James Anderson"
  notes: string;
  items: RequestItemLine[];
}

export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
}
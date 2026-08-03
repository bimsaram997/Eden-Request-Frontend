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
  createdAt: string; 
  employeeId: number;
  name: string;      
  notes: string;
  items: RequestItemLine[];
}

export interface PagedResponse<T> {
  data: T[];
  totalCount: number;
}
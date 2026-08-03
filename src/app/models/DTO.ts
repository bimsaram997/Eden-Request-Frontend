export interface HistoryQueryDto {
    page: number;
    pageSize: number;
    roomSearch: string | null;
    status: string | null;
    fromDate: string | null;
    toDate: string | null;
    roomListId: number | null;
    categoryId: number | null;
    itemId: number | null;
}

export interface ExtendedFilterPayload {
  roomSearch: string | null;
  roomListId: number | null;
  status: string | null;
  categoryId: number | null;
  targetEmployeeId: number | null;
  fromDate: Date | null;
  toDate: Date | null;
  itemIds: number[] | null; 
  fromTime: string | null;  
  toTime: string | null;    
  
}

export interface ExtraWorkRequestFilterPayload {
listNumber: number | null;
roomNumber: number | null;
extraWorkItemIds: number[] | null;
status: string | null;
requestedById: number | null;
assignedToId: number | null;
fromDate: Date | null;
toDate: Date | null;
fromTime: string | null;   
toTime: string | null;    
isToday: boolean | null; 
}

export interface CreateExtraWorkRequestDto {
  roomNumber: string;
  listNumber: number;
  requestedById: number;
  assignedToId: number;
  notes: string | null;
  lines: CreateExtraRequestLineDto[];
}

export interface CreateExtraRequestLineDto {
  extraWorkItemId: number;
  quantity: number;
}


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
// 1. Update the interface to look exactly like your single-select + multi-item properties
export interface ExtendedFilterPayload {
  roomSearch: string | null;
  roomListId: number | null;
  status: string | null;
  categoryId: number | null;
  targetEmployeeId: number | null;
  fromDate: Date | null;
  toDate: Date | null;
  itemIds: number[] | null; // Array for multi-select items
  fromTime: string | null;   // e.g., "08:00"
  toTime: string | null;     // e.g., "16:30"
  
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
fromTime: string | null;   // e.g., "08:00"
toTime: string | null;     // e.g., "16:30"
isToday: boolean | null; // New property to indicate if the filter is for today's requests
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


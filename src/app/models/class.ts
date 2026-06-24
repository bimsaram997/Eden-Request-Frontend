export interface Employee { id: number; name: string; role: string; }
export interface ItemCategory { id: number; name: string; }
export interface Item { id: number; name: string; itemCategoryId: number; category?: ItemCategory; }
export interface RequestLine { id?: number; itemId: number; item?: Item; quantity: number; unitType: 'Pcs' | 'Trolley'; }
export interface RequestHeader { id?: number; roomNumber: string | null; status: 'Pending' | 'Acknowledged' | 'Delivered'; employeeId: number; employee?: Employee; roomListId: number; lines: RequestLine[]; }
export interface UserSession { id: number; name: string; role: 'Housekeeper' | 'TeamLeader'; }
export interface PlaceBulkRequestDto { employeeId: number; roomListId: number; roomNumber: string | null; items: { itemId: number; quantity: number; unitType: string; }[]; }
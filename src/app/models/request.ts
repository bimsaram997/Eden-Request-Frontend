export interface LoginRequest { email: string; password: string; }

export interface BulkLine {
    itemId: number;
    quantity: number;
    unitType: string;
}

export interface PlaceBulkRequest {
    employeeId: number;
    roomListId: number;
    roomNumber: string | null; // string? in C# translates to allowing null
    items: BulkLine[];
    notes?: string ;
}
export interface UpdateRquestHeaderRequest {
    status: string;
    updatedBy: number;
}
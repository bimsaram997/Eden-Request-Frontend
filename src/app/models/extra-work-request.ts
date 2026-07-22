export interface ExtraWorkRequestDto {
    id: number;
    roomNumber: number;
    listNumber: number | null;
    status: string;
    requestedById: number;
    requestedByEmployee: string;
    assignedToId: number;
    assignedToEmployee: string;
    updatedById: number | null;
    updatedByEmployee: string;
    addedDate: string;
    notes: string | null;
    lines: ExtraRequestLineDto[];
   acknowledgedDate: string | null;
   doneDate: string | null; 
  
}

export interface ExtraRequestLineDto {
    id: number;
    extraWorkItemId: number;
    extraWorkItemName: string;
    quantity: number;
}

export interface CreateExtraWorkRequestDto {
    roomNumber: number;
    requestedById: number;
    assignedToId: number;
    listNumber: number | null;
    notes: string | null;
    lines: CreateExtraRequestLineDto[];
}

export interface CreateExtraRequestLineDto {
    extraWorkItemId: number;
    quantity: number;
}

export interface UpdateExtraWorkRequestDto {
    status: string;
    updatedById: number;
}
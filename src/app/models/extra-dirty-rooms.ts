export interface ExtraDirtyReportResponse {
  message: string;
  reportId: number;
  uploadedFilesCount: number;
}

export interface MediaFileDto {
  id: number;
  url: string;
  publicId: string;
  mediaType: string;
}

export interface ExtraDirtyReportDto {
  id: number;
  roomNumber: string;
  reportedById: number;
  reportedByEmployee: string;
  notes?: string;
  createdAt: string;
  mediaFiles: MediaFileDto[];
}

export interface ExtraDirtyFilterPayload {
  isTeamLeader?: boolean;
  reportedById?: number | null;
  roomNumber?: string | null;
  isToday?: boolean | null;
  fromDate?: string | null;
  fromTime?: string | null;
  toDate?: string | null;
  toTime?: string | null;
}

export interface CreateReportMetadataDto {
  roomNumber: string;
  reportedById: number;
  notes?: string;
}

export interface MetadataResponse {
  reportId: number;
  message: string;
}

export interface MediaFile {
  id?: number;
  url?: string;
  fileUrl?: string;
  mediaType?: string;
  type?: string;
}
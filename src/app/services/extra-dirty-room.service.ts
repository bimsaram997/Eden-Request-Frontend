import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { CreateReportMetadataDto, ExtraDirtyFilterPayload, ExtraDirtyReportResponse, MetadataResponse } from '../models/extra-dirty-rooms';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ExtraDirtyRoomService {
  myUrl = environment.baseUrl;
  constructor(private http: HttpClient) { }

  placeExtraDiryRoom(placeExtraWorkRequest: FormData): Observable<ExtraDirtyReportResponse> {
    return this.http.post<ExtraDirtyReportResponse>(
      `${this.myUrl}/ExtraDirtyReports`, placeExtraWorkRequest
    );
  }

  public getPagedExtraDirtyReports(filterQuery: ExtraDirtyFilterPayload): Observable<any> {

    const urlString = `${this.myUrl}/ExtraDirtyReports/getAll`;
    return this.http.post<any>(urlString, filterQuery);
  }

  createReportMetadata(metadata: { roomNumber: string; reportedById: number; notes?: string }): Observable<{ reportId: number; message: string }> {
    return this.http.post<{ reportId: number; message: string }>(
      `${this.myUrl}/ExtraDirtyReports/metadata`, metadata
    );
  }

  uploadReportMedia(reportId: number, filesFormData: FormData): Observable<any> {
    return this.http.post<any>(
      `${this.myUrl}/ExtraDirtyReports/${reportId}/media`, filesFormData
    );
  }

}

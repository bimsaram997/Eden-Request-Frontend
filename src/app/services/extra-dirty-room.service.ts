import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { ExtraDirtyFilterPayload, ExtraDirtyReportResponse } from '../models/extra-dirty-rooms';
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

   public getPagedExtraDirtyReports( filterQuery: ExtraDirtyFilterPayload ): Observable<any> {
      // 🚥 Passes the security flag through the URL query string mapping as required by [FromQuery] in C#
      const urlString = `${this.myUrl}/ExtraDirtyReports/getAll`;
      return this.http.post<any>(urlString, filterQuery);
    }
}

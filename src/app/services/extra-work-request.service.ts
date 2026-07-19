import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExtraWorkRequestFilterPayload } from '../models/DTO';
import { CreateExtraWorkRequestDto, UpdateExtraWorkRequestDto } from '../models/extra-work-request';

@Injectable({
  providedIn: 'root'
})
export class ExtraWorkRequestService {

 myUrl = environment.baseUrl;
   constructor(private http: HttpClient) { }
 public getPagedExtraWorkRequests( filterQuery: ExtraWorkRequestFilterPayload ): Observable<any> {
    // 🚥 Passes the security flag through the URL query string mapping as required by [FromQuery] in C#
    const urlString = `${this.myUrl}/ExtraWorkRequests/getAll`;

    // 📦 Sends the combined pagination parameters and search arrays down in the request body payload
    return this.http.post<any>(urlString, filterQuery);
  }

    public placExtraWorkRequest( placeExtraWorkRequest:CreateExtraWorkRequestDto ): Observable<any> {
      return this.http.post(`${this.myUrl}/ExtraWorkRequests/createExtraWorkRequest`, placeExtraWorkRequest );
  }

   public updateExtraWorkRequestStatus(id: number, payload: UpdateExtraWorkRequestDto): Observable<any> {
      return this.http.put(`${this.myUrl}/ExtraWorkRequests/${id}`, payload);
    }
  
    public getExtraWorkRequestById(id: number): Observable<any> {
    return this.http.get(`${this.myUrl}/ExtraWorkRequests/${id}`);
  }
}

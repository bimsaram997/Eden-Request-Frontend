import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlaceBulkRequest, UpdateRquestHeaderRequest } from '../models/request';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  myUrl = environment.baseUrl;
  
  constructor(private http: HttpClient) { }

  public placeBulkRequest(placeBulkRequest: PlaceBulkRequest): Observable<any> {
    return this.http.post(`${this.myUrl}/Request/placeBulkRequest`, placeBulkRequest);
  }
  public getPagedHistory(employeeId: number, isTeamLeader: boolean, filterQuery: any): Observable<any> {
    const urlString = `${this.myUrl}/Request/employee/${employeeId}/history?isTeamLeader=${isTeamLeader}`;
    return this.http.post<any>(urlString, filterQuery);
  }

  public updateRequestStatus(id: number, payload: UpdateRquestHeaderRequest): Observable<any> {
    return this.http.put(`${this.myUrl}/Request/${id}`, payload);
  }

  public getRequestById(id: number): Observable<any> {
    return this.http.get(`${this.myUrl}/Request/${id}`);
  }
}

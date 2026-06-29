import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PlaceBulkRequest } from '../models/request';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  myUrl = environment.baseUrl;
  constructor(private http: HttpClient) { }
  
  public placeBulkRequest( placeBulkRequest:PlaceBulkRequest ): Observable<any> {
    return this.http.post(`${this.myUrl}/Request/placeBulkRequest`, placeBulkRequest );
}
public getPagedHistory(employeeId: number, isTeamLeader: boolean, filterQuery: any): Observable<any> {
    // 🚥 Passes the security flag through the URL query string mapping as required by [FromQuery] in C#
    const urlString = `${this.myUrl}/Request/employee/${employeeId}/history?isTeamLeader=${isTeamLeader}`;

    // 📦 Sends the combined pagination parameters and search arrays down in the request body payload
    return this.http.post<any>(urlString, filterQuery);
  }

}

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

}

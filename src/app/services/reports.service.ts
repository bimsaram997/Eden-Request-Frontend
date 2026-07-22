import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  myUrl = environment.baseUrl;
  constructor(private http: HttpClient) { }

public getReportsByHouseKeeperId(housekeeperId: number): Observable<any> {
   return this.http.get(`${this.myUrl}/Reports/housekeeper/${housekeeperId}`);
  }
}


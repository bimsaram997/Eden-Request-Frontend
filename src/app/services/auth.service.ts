import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoginRequest } from '../models/request';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

 public login(loginPayload: LoginRequest): Observable<any> {
  // 🚀 Pass payload directly as the POST body object. Cleaner, safer, and Firefox friendly!
  return this.http.post<any>(`${this.baseUrl}/Employee/login`, loginPayload);
}

   public loadAllEmployees(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Employee/getAllEmployee`);
  }

   public getEmployeeGenericDataById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/Employee/${id}`);
  }
}

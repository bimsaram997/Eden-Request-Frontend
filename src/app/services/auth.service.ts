import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { LoginRequest } from '../models/request';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
baseUrl = environment.baseUrl;

  constructor(private http: HttpClient) { }

  public login(loginPayload: LoginRequest): Observable<any> {
    const email = encodeURIComponent(loginPayload.email); 
    const password = encodeURIComponent(loginPayload.password);

    return this.http.post<any>(`${this.baseUrl}/Employee/${email}/${password}`, {});
  }

   public loadAllEmployees(): Observable<any> {
    return this.http.get(`${this.baseUrl}/Employee/getAllEmployee`);
  }
}

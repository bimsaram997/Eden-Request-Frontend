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
    const email = encodeURIComponent(loginPayload.email); // Safely encodes special characters like '@'
    const password = encodeURIComponent(loginPayload.password);

    // Note: Passing an empty object `{}` as the body since the data is contained entirely in the URL path.
    return this.http.post<any>(`${this.baseUrl}/Employee/${email}/${password}`, {});
  }
}

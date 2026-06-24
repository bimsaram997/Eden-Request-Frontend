import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ItemCategoryService {
baseUrl = environment.baseUrl;
  constructor(private http: HttpClient) { }

  public getItemCategories(): Observable<any> {
    return this.http.get(`${this.baseUrl}/ItemCategory/getAll`);
  }
}

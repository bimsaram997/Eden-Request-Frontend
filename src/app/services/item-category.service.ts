import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})

export class ItemCategoryService {
baseUrl = environment.baseUrl;
  constructor(private http: HttpClient) { }

  public getItemCategories(): Observable<any> {
    return this.http.post(`${this.baseUrl}/ItemCategory/getAll`, {});
  }
}

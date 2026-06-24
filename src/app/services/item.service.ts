import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ItemService {
baseUrl = environment.baseUrl;
  constructor(private http: HttpClient) { }

  public getItemsByCategory(categoryId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/Item/itemsByCategoryId/${categoryId}`);
  }
}
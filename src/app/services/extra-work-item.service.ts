import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class ExtraWorkItemService {

  myUrl = environment.baseUrl;
  constructor(private http: HttpClient) { }

   public getAllExtraWorkItems(): Observable<any> {
      return this.http.get(`${this.myUrl}/ExtraWorkItems/getAll`, {});
    }
}

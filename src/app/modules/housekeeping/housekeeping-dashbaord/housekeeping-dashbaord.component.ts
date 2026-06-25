import { Component } from '@angular/core';
import { RequestListComponent } from "./components/request-list/request-list.component";
import { Router } from '@angular/router';
import { MATERIAL_COMPONENTS } from '../../../shared/utils/material-imports';

@Component({
  selector: 'app-housekeeping-dashbaord',
  standalone: true,
  imports: [RequestListComponent, MATERIAL_COMPONENTS],
  templateUrl: './housekeeping-dashbaord.component.html',
  styleUrl: './housekeeping-dashbaord.component.css'
})
export class HousekeepingDashbaordComponent {


  constructor(private router: Router) { }
  routeToRequest() {
this.router.navigate(['/workspace/request-form']);
  }
}

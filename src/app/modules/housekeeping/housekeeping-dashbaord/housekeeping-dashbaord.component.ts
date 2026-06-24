import { Component } from '@angular/core';
import { RequestListComponent } from "./components/request-list/request-list.component";

@Component({
  selector: 'app-housekeeping-dashbaord',
  standalone: true,
  imports: [RequestListComponent],
  templateUrl: './housekeeping-dashbaord.component.html',
  styleUrl: './housekeeping-dashbaord.component.css'
})
export class HousekeepingDashbaordComponent {

}

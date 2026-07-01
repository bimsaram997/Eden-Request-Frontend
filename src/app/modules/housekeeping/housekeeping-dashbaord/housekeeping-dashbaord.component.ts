import { Component, OnDestroy, OnInit } from '@angular/core';
import { RequestListComponent } from "./components/request-list/request-list.component";
import { Router } from '@angular/router';
import { MATERIAL_COMPONENTS } from '../../../shared/utils/material-imports';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationServiceService } from '../../../services/notification-service.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-housekeeping-dashbaord',
  standalone: true,
  imports: [RequestListComponent, MATERIAL_COMPONENTS],
  templateUrl: './housekeeping-dashbaord.component.html',
  styleUrl: './housekeeping-dashbaord.component.css'
})
export class HousekeepingDashbaordComponent implements OnInit, OnDestroy   {
  private activeSubscriptions: any[] = [];
  session: any;

  constructor(private router: Router,
    private notificationService: NotificationServiceService,
    private snackBar: MatSnackBar
  ) { }


  routeToRequest() {
    this.router.navigate(['/workspace/request-form']);
  }


  ngOnInit(): void {
    this.session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    const email = this.session.email || '';
    const role = this.session.role || this.session.userRole || 'Housekeeper';

    // this.notificationService.startConnection(email, role);
    // if(role == "Housekeeper") {
    //   const statusSub = this.notificationService.housekeeperStatusUpdates$.subscribe({
    //   next: (update) => {
    //     this.snackBar.open(`⚡ A Team Leader updated your Room ${update.roomNumber} request to: ${update.status}`, 'OK', {
    //       duration: 6000
    //     });
    //     //this.refreshMyTasks();
    //   },
    //   // Add these two lines to satisfy the IStreamSubscriber interface requirements:
    //   error: (err) => console.error('SignalR Stream Error:', err),
    //   complete: () => console.log('SignalR Stream Completed')
    // }) as any;

    // this.activeSubscriptions.push(statusSub);
    // }

    
  }

  refreshMyTasks(): void { /* Logic to reload the housekeeper's task list from API */ }
 ngOnDestroy(): void {
    // 🟢 4. FIX: Safely loop and unsubscribe individually without throwing errors
    this.activeSubscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { RequestListComponent } from "./components/request-list/request-list.component";
import { Router } from '@angular/router';
import { MATERIAL_COMPONENTS } from '../../../shared/utils/material-imports';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationServiceService } from '../../../services/notification-service.service';
import { Subscription } from 'rxjs';
import { PushNotificationService } from '../../../services/push-notification.service';

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
    private snackBar: MatSnackBar,
    private pushService: PushNotificationService
  ) { }


  routeToRequest() {
    this.router.navigate(['/workspace/request-form']);
  }


  ngOnInit(): void {
  //   setTimeout(() => {
  //   this.session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    
  //   console.log("📦 Loaded session object post-login:", this.session);

  //   const email = this.session.email || '';
  //   const role = this.session.role || this.session.userRole || 'Housekeeper';
    
  //   // Explicitly fallback across all common property names to protect identity
  //   const currentEmployeeId = this.session.id || this.session.employeeId || this.session.userId || null;

  //   console.log(`👤 Current Employee ID located: ${currentEmployeeId}`);

  //   if (currentEmployeeId) {
  //     this.pushService.subscribeUserDevice(currentEmployeeId);
  //   } else {
  //     console.warn("⚠️ Could not register push notifications: currentEmployeeId missing from localStorage.");
  //   }
  // }, 300);
    
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

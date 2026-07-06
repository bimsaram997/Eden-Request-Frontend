import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationServiceService } from '../../../services/notification-service.service';
import { PushNotificationService } from '../../../services/push-notification.service';

@Component({
  selector: 'app-team-leader-dash-board',
  standalone: true,
  imports: [],
  templateUrl: './team-leader-dash-board.component.html',
  styleUrl: './team-leader-dash-board.component.css'
})
export class TeamLeaderDashBoardComponent implements OnInit, OnDestroy {
  private activeSubscriptions: any[] = [];
  session: any;

  constructor(
    private notificationService: NotificationServiceService,
    private pushService: PushNotificationService,
    
    private snackBar: MatSnackBar
  ) { }

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

  refreshRequestGrid(): void {
    console.log('Refreshing main leader dashboard layout grid...');
    // Add your API endpoint calling logic here
  }

  triggerPushManually() {
  console.log("Button clicked. Invoking push prompt...");
  this.pushService.subscribeUserDevice(Number(localStorage.getItem('userEmployeeId')));
}
ngOnDestroy(): void {
    // 🟢 4. FIX: Safely loop and unsubscribe individually without throwing errors
    this.activeSubscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
  
  }
}

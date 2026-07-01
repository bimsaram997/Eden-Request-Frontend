import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationServiceService } from '../../../services/notification-service.service';

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
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    const email = this.session.email || '';
    const role = this.session.role || this.session.userRole || 'TeamLeader';

    this.notificationService.startConnection(email, role);

   
  }

  refreshRequestGrid(): void {
    console.log('Refreshing main leader dashboard layout grid...');
    // Add your API endpoint calling logic here
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

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MATERIAL_COMPONENTS } from '../../../shared/utils/material-imports';
import { NotificationServiceService } from '../../../services/notification-service.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterOutlet, MATERIAL_COMPONENTS],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {

  @Output() public sidenavToggle = new EventEmitter();
  session: any;
  isTeamLeaderUser!: boolean;

  constructor(private router: Router, private notificationService: NotificationServiceService) { }

  ngOnInit(): void {
    this.session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeaderUser = (this.session.role || this.session.userRole) === 'TeamLeader';

  }


  onToogleSlidenav() {
    this.sidenavToggle.emit();
  }

  navigateToHome() {
    if (this.isTeamLeaderUser) {
      this.router.navigate(['/workspace/leader-dashboard']);
    } else {
      this.router.navigate(['/workspace/housekeeper-dashboard']);
    }
  }

  public logOut(): void {
    const currentEmail = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}').email;
    this.notificationService.stopConnection(currentEmail);
    localStorage.removeItem('scandic_eden_session');
    this.router.navigate(['']).then(() => {
      window.location.reload();
    });
  }
}

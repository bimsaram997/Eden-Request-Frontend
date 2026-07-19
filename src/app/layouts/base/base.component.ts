import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { NavbarComponent } from "./navbar/navbar.component";
import { SidenavbarComponent } from './sidenavbar/sidenavbar.component';
import { MATERIAL_COMPONENTS } from '../../shared/utils/material-imports';
import { NotificationServiceService } from '../../services/notification-service.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidenavbarComponent, MATERIAL_COMPONENTS],
  templateUrl: './base.component.html',
  styleUrl: './base.component.css'
})
export class BaseComponent implements OnInit, OnDestroy {
  private activeSubscriptions: any[] = [];
  isTeamLeaderUser: boolean = false;
  public isSidenavOpen = false;

  // Grab the sidebar elements out of the layout template dynamically
  @ViewChild('sidebarDesktop', { static: false }) sidebarDesktop!: ElementRef;
  @ViewChild('sidebarMobile', { static: false }) sidebarMobile!: ElementRef;

  constructor(private notificationService: NotificationServiceService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeaderUser = (session.role || session.userRole) === 'TeamLeader';

    const email = session.email || '';
    const role = session.role || session.userRole || 'Housekeeper';
this.notificationService.startConnection(email, role);
    if (role === "Housekeeper") {

      
      if (role == "Housekeeper") {
        const statusSub = this.notificationService.housekeeperStatusUpdates$.subscribe({
          next: (update) => {
            this.snackBar.open(`⚡ A Team Leader updated your Room ${update.roomNumber} request to: ${update.status}`, 'OK', {
              duration: 6000
            });
            //this.refreshMyTasks();
          },
          // Add these two lines to satisfy the IStreamSubscriber interface requirements:
          error: (err) => console.error('SignalR Stream Error:', err),
          complete: () => console.log('SignalR Stream Completed')
        }) as any;

        const extraWorkSub = this.notificationService.housekeeperNewExtraWork$.subscribe({
          next: (extraWork) => {
            this.snackBar.open(`⚡ You have a new extra work request for Room ${extraWork.roomNumber}!`, 'OK', {
              duration: 6000
            });
            //this.refreshMyTasks();
          },
          // Add these two lines to satisfy the IStreamSubscriber interface requirements:
          error: (err) => console.error('SignalR Stream Error:', err),
          complete: () => console.log('SignalR Stream Completed')
        }) as any;

        this.activeSubscriptions.push(statusSub, extraWorkSub);
      }
    } else if (role === "TeamLeader") {
       const requestSub = this.notificationService.leaderNewRequests$.subscribe({
      next: (request) => {
        this.snackBar.open(`🚨 Housekeeper (${request.createdBy}) created a request for Room ${request.roomNumber}!`, 'CLOSE', {
          duration: 6000
        });
        //this.refreshRequestGrid(); // Reloads your admin table
      },
      error: (err) => console.error('Leader stream error:', err),
      complete: () => { }
    }) as any;

     const extraWorkSub = this.notificationService.leaderExtraWorkStatusUpdates$.subscribe({
          next: (extraWork) => {
            this.snackBar.open(`⚡ Your extra work request for Room ${extraWork.roomNumber} has been updated!`, 'OK', {
              duration: 6000
            });
            //this.refreshMyTasks();
          },
          // Add these two lines to satisfy the IStreamSubscriber interface requirements:
          error: (err) => console.error('SignalR Stream Error:', err),
          complete: () => console.log('SignalR Stream Completed')
        }) as any;

    this.activeSubscriptions.push(requestSub);
    }
  }

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // If the sidebar is already shut, ignore clicks completely
    if (!this.isSidenavOpen) {
      return;
    }

    const clickedElement = event.target as HTMLElement;

    // Check if the click landing pad falls within the panels
    const clickedInsideDesktop = this.sidebarDesktop?.nativeElement?.contains(clickedElement);
    const clickedInsideMobile = this.sidebarMobile?.nativeElement?.contains(clickedElement);

    // Identify navbar elements/triggers to make sure toggle buttons don't cross-cancel
    const clickedNavbarToggle = clickedElement.closest('.navbar-toggler') ||
      clickedElement.closest('.bi-list') ||
      clickedElement.closest('app-navbar');

    // If the user clicked outside the side bars, and didn't touch the toggle trigger, close it!
    if (!clickedInsideDesktop && !clickedInsideMobile && !clickedNavbarToggle) {
      this.isSidenavOpen = false;
    }
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

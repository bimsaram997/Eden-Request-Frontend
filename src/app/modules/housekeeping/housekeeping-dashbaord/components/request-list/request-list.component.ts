import { Component, OnDestroy, OnInit } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../../../../shared/utils/material-imports';
import { PageEvent } from '@angular/material/paginator';
import { RequestService } from '../../../../../services/request.service';
import { Subscription } from 'rxjs';

import { RequestsSearchComponent } from '../../../../../shared/components/requests-search/requests-search.component';
import { ExtendedFilterPayload } from '../../../../../models/DTO';
import { RequestHistoryCardComponent } from '../../../../../shared/components/request-history-card/request-history-card.component';
import { NotificationServiceService } from '../../../../../services/notification-service.service';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [MATERIAL_COMPONENTS, RequestHistoryCardComponent, RequestsSearchComponent],
  templateUrl: './request-list.component.html',
  styleUrl: './request-list.component.css'
})
export class RequestListComponent implements OnInit, OnDestroy {
  // Pagination State Tracking Flags
  currentPage = 1;
  pageSize = 6;
  totalRecords = 0;
  userRequests: any[] = [];

  isTeamLeaderUser = false;
  private subs:any[] = [];

  activeFilters: ExtendedFilterPayload = {
    roomSearch: null,
    roomListId: null,
    status: 'All',
    categoryId: null,
    targetEmployeeId: null,
    fromDate: null,
    toDate: null,
    itemIds: [],
    toTime: null,
    fromTime: null
  };
  session: any;
  notificationSub: any;

  constructor(private requestService: RequestService,
              private notificationService: NotificationServiceService
  ) { }

  ngOnInit(): void {
     this.session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeaderUser = (this.session.role || this.session.userRole) === 'TeamLeader';

    // Initial data fetch happens automatically when the child component initializes and emits
    this.fetchHistoryPage();
    this.changeDetection(); // Set up real-time updates via SignalR
    
  }

changeDetection(): void {
  const requestSub = this.notificationService.leaderNewRequests$.subscribe({
    next: () => this.fetchHistoryPage(),
    error: (err: any) => console.error('Leader stream error:', err),
    complete: () => {}
  });

  const statusSub = this.notificationService.housekeeperStatusUpdates$.subscribe({
    next: () => this.fetchHistoryPage(),
    error: (err: any) => console.error('Housekeeper stream error:', err),
    complete: () => {}
  });

  this.subs.push(requestSub);
  this.subs.push(statusSub);
}

  onFilterCriteriaChanged(payload: ExtendedFilterPayload): void {
    this.activeFilters = payload;
    this.currentPage = 1; // ⏪ Crucial: Reset back to page 1 whenever search criteria changes
    this.fetchHistoryPage();
  }


  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1; // Material uses 0-based indexing, C# API uses 1-based indexing
    this.fetchHistoryPage();
  }

  fetchHistoryPage(): void {
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    const employeeId = session.id || session.employeeId;

    if (!employeeId) return;
    const formatLocalDateText = (dateInput: any): string | null => {
      if (!dateInput) return null;
      const d = new Date(dateInput);

      // Extracts calendar numbers directly, ignoring UTC conversions
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`; // "2026-06-26"
    };

    // Bundle pagination settings along with  active multi-select filters layout
    const requestPayload = {
      page: this.currentPage,
      pageSize: this.pageSize,
      roomSearch: this.activeFilters.roomSearch,
      roomListId: this.activeFilters.roomListId,
      status: this.activeFilters.status,
      categoryId: this.activeFilters.categoryId,
      targetEmployeeId: this.activeFilters.targetEmployeeId,
      itemIds: this.activeFilters.itemIds,
      // Format date properties securely to ISO strings or null strings
      fromDate: formatLocalDateText(this.activeFilters.fromDate),
      toDate: formatLocalDateText(this.activeFilters.toDate),
      fromTime: this.activeFilters.fromTime,
      toTime: this.activeFilters.toTime
    };

    const historySub = this.requestService
      .getPagedHistory(employeeId, this.isTeamLeaderUser, requestPayload)
      .subscribe({
        next: (response) => {
          this.userRequests = response.data || [];
          this.totalRecords = response.totalCount || 0;
        },
        error: (err) => console.error('Failed fetching filtered request registry streams:', err)
      });

    this.subs.push(historySub);
  }

  handleStatusUpdate(event: { requestId: number, currentStatus: string, newStatus: string }): void {
  const current = event.currentStatus;
  const next = event.newStatus;
    if (current === 'Pending' && next !== 'Acknowledge') {
    alert('Cannot change status! A pending request must be "Acknowledged"  before any other actions can be taken.');
    // If you use MatSnackBar, you can replace the alert above with:
    // this.snackBar.open('Pending requests must be Approved first.', 'Close', { duration: 3000 });
    return; // Halt execution early
  }
    console.log(`Updating request ${event.requestId} to status: ${event.newStatus}`);
    const payload = {
      status: event.newStatus,
      updatedBy: this.session.id || this.session.employeeId
    };
    // Call your backend API service here to save changes
    this.requestService.updateRequestStatus(event.requestId, payload).subscribe({
      next: (response) => {
        console.log('Status updated successfully in backend!');
        this.fetchHistoryPage(); // Refresh the list to reflect the new status
        // Optional: Refresh your lists or local array data here
      },
      error: (err) => {
        console.error('Failed to update status:', err);
      }
    });
  }

 ngOnDestroy(): void {
  this.subs.forEach((sub: any) => {
    if (sub && typeof sub.unsubscribe === 'function') {
      sub.unsubscribe();
    }
  });
}
}

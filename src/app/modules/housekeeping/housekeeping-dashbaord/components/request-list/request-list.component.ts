import { Component, OnDestroy, OnInit } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../../../../shared/utils/material-imports';
import { PageEvent } from '@angular/material/paginator';
import { RequestService } from '../../../../../services/request.service';
import { Subscription } from 'rxjs';

import { RequestsSearchComponent } from '../../../../../shared/components/requests-search/requests-search.component';
import { ExtendedFilterPayload } from '../../../../../models/DTO';
import { RequestHistoryCardComponent } from '../../../../../shared/components/request-history-card/request-history-card.component';
import { NotificationServiceService } from '../../../../../services/notification-service.service';
import { Router } from '@angular/router';
import { PagedResponse, RequestModel } from '../../../../../models/request.model';

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
  userRequests: RequestModel[] = [];

  isTeamLeaderUser = false;
  private subs: any[] = [];
  updatingRequestIds = new Set<number>();
  isUpdating = false;
  isSearching = false;
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
    private notificationService: NotificationServiceService,
    private router: Router,
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
      complete: () => { }
    });

    const statusSub = this.notificationService.housekeeperStatusUpdates$.subscribe({
      next: () => this.fetchHistoryPage(),
      error: (err: any) => console.error('Housekeeper stream error:', err),
      complete: () => { }
    });

    this.subs.push(requestSub);
    this.subs.push(statusSub);
  }

  onFilterCriteriaChanged(payload: ExtendedFilterPayload): void {
    this.activeFilters = payload;
    this.currentPage = 1; //  Crucial: Reset back to page 1 whenever search criteria changes
    this.isSearching = true;
    this.fetchHistoryPage();
  }


  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1; // Material uses 0-based indexing, C# API uses 1-based indexing
    this.fetchHistoryPage();
  }

fetchHistoryPage(): void {
  const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
  const employeeId = session.id || session.employeeId;

  if (!employeeId) {
    this.isSearching = false;
    return;
  }
  
  const formatLocalDateText = (dateInput: any): string | null => {
    if (!dateInput) return null;
    const d = new Date(dateInput);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  // 📝 Explicit query filter setup matching backend payload property keys
  const requestPayload = {
    page: this.currentPage,
    pageSize: this.pageSize,
    roomId: this.activeFilters.roomListId || null,
    requestedById: this.isTeamLeaderUser ? null : employeeId,
    assignedToId: this.activeFilters.targetEmployeeId || null,
    status: this.activeFilters.status || 'All',
    fromDate: formatLocalDateText(this.activeFilters.fromDate),
    toDate: formatLocalDateText(this.activeFilters.toDate),
    fromTime: this.activeFilters.fromTime || null,
    toTime: this.activeFilters.toTime || null
  };

  const historySub = this.requestService
    .getPagedHistory(employeeId, this.isTeamLeaderUser, requestPayload)
    .subscribe({
      //  Apply Option A here: explicit type definition on the incoming stream response
      next: (response: PagedResponse<RequestModel>) => {
        // Now fully typed! compiler verifies data arrays layout and total fields
        this.userRequests = response.data || []; // userRequests field must be defined as: RequestModel[]
        this.totalRecords = response.totalCount || 0;
        this.isSearching = false;
      },
      error: (err: any) => {
        console.error('Failed fetching filtered request registry streams:', err);
        this.isSearching = false;
      }
    });

  this.subs.push(historySub);
}

  handleStatusUpdate(event: { requestId: number, currentStatus: string, newStatus: string }): void {
    const current = event.currentStatus;
    const next = event.newStatus;

    // 1. SILENT GUARD: If this specific card is already updating, immediately ignore additional duplicate events
    if (this.updatingRequestIds.has(event.requestId)) {
      return;
    }

    // 2. REDUNDANCY GUARD: Stop network requests if the dropdown value hasn't actually changed
    if (current === next) {
      console.warn(`Request ${event.requestId} status change ignored: target state matches current state.`);
      return;
    }

    // Business Logic Guard
    if (current === 'Pending' && next !== 'Acknowledge') {
      alert('Cannot change status! A pending request must be "Acknowledged" before any other actions can be taken.');
      return;
    }

    console.log(`Updating request ${event.requestId} to status: ${event.newStatus}`);

    const payload = {
      status: event.newStatus,
      updatedBy: this.session.id || this.session.employeeId
    };

    // 3. LOCK: Drop this request ID into our tracking set to shut down ghost events
    this.updatingRequestIds.add(event.requestId);

    this.requestService.updateRequestStatus(event.requestId, payload).subscribe({
      next: (response) => {
        console.log('Status updated successfully in backend!');

        // The array update triggers accordion DOM structural updates safely now
        this.fetchHistoryPage();

        // 4. UNLOCK: Clear tracking after the operation concludes successfully
        this.updatingRequestIds.delete(event.requestId);
      },
      error: (err) => {
        console.error('Failed to update status:', err);
        this.fetchHistoryPage();
        // 5. UNLOCK ON FAILURE: Ensure the user can try again if the API fails
        this.updatingRequestIds.delete(event.requestId);
      }
    });
  }

  routeToRequest() {
    this.router.navigate(['/workspace/request-form']);
  }
  ngOnDestroy(): void {
    this.subs.forEach((sub: any) => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
  }
}

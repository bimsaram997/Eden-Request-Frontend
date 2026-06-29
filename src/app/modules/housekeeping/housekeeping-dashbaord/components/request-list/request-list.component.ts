import { Component, OnDestroy, OnInit } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../../../../shared/utils/material-imports';
import { PageEvent } from '@angular/material/paginator';
import { RequestService } from '../../../../../services/request.service';
import { Subscription } from 'rxjs';

import { RequestsSearchComponent } from '../../../../../shared/components/requests-search/requests-search.component';
import { ExtendedFilterPayload } from '../../../../../models/DTO';
import { RequestHistoryCardComponent } from '../../../../../shared/components/login/request-history-card/request-history-card.component';

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
  private subs = new Subscription();

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

  constructor(private requestService: RequestService) { }

  ngOnInit(): void {
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeaderUser = (session.role || session.userRole) === 'TeamLeader';

    // Initial data fetch happens automatically when the child component initializes and emits
    this.fetchHistoryPage();
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

    this.subs.add(historySub);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe(); // Clean up lingering stream observations to prevent memory leaks
  }
}

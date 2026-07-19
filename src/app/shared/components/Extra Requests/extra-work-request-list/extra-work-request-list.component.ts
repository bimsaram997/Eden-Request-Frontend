import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ExtraWorkRequestSearchComponent } from '../extra-work-request-search/extra-work-request-search.component';
import { ExtendedFilterPayload, ExtraWorkRequestFilterPayload } from '../../../../models/DTO';
import { ExtraWorkRequestService } from '../../../../services/extra-work-request.service';
import { NotificationServiceService } from '../../../../services/notification-service.service';
import { PageEvent } from '@angular/material/paginator';
import { PagedResponse } from '../../../../models/request.model';
import { ExtraWorkRequestDto, UpdateExtraWorkRequestDto } from '../../../../models/extra-work-request';
import { ExtraWorkRequestCardComponent } from '../extra-work-request-card/extra-work-request-card.component';
import { MATERIAL_COMPONENTS } from '../../../utils/material-imports';
import { Router } from '@angular/router';

@Component({
  selector: 'app-extra-work-request-list',
  standalone: true,
  imports: [ExtraWorkRequestSearchComponent, ExtraWorkRequestCardComponent, MATERIAL_COMPONENTS],
  templateUrl: './extra-work-request-list.component.html',
  styleUrl: './extra-work-request-list.component.css'
})
export class ExtraWorkRequestListComponent implements OnInit, OnDestroy {
  // 🟢 1. Bind a query reference to your search child component to extract form values directly on tab change
  @ViewChild(ExtraWorkRequestSearchComponent) searchComponent!: ExtraWorkRequestSearchComponent;

  activeFilters: ExtraWorkRequestFilterPayload = {
    roomNumber: null,
    listNumber: null,
    extraWorkItemIds: [],
    status: 'All',
    requestedById: null,
    assignedToId:  null,
    fromDate: null,
    toDate: null,
    fromTime: null, 
    toTime: null, 
    isToday: null,
  }
  isSearching = false;
  currentPage = 1;
  pageSize = 6;
  totalRecords: number = 0;
  isToday: boolean = true;
  session: any;
  isTeamLeaderUser!: boolean;
  private subs: any[] = [];
  extrWorkRequests!: ExtraWorkRequestDto[];
  updatingRequestIds = new Set<number>();
  fromStr!: string | null;
  toStr!: string | null;
  todayStr!: string;

  constructor(
    private extraWorkRequestService: ExtraWorkRequestService,
    private notificationService: NotificationServiceService,
    private router: Router
  ) { }

  ngOnInit(): void {
    console.log('ExtraWorkRequestListComponent initialized.');
    this.session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeaderUser = (this.session.role || this.session.userRole) === 'TeamLeader';
    this.fetchHistoryPage();
    this.changeDetection();
    this.selectTodayTab();
  }

  changeDetection(): void {
    const requestSub = this.notificationService.housekeeperNewExtraWork$.subscribe({
      next: () => this.fetchHistoryPage(),
      error: (err: any) => console.error('Leader stream error:', err),
      complete: () => { }
    });

    const extraRequestSub = this.notificationService.leaderExtraWorkStatusUpdates$.subscribe({
      next: () => this.fetchHistoryPage(),
      error: (err: any) => console.error('Leader stream error:', err),
      complete: () => { }
    });
    this.subs.push(requestSub, extraRequestSub);
  }

  fetchHistoryPage() {
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    const employeeId = session.id || session.employeeId;

    if (!employeeId) {
      this.isSearching = false;
      return;
    }

    const formatLocalDateText = (dateInput: any): string | null => {
      if (!dateInput) return null;
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return null;

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    const requestPayload: any = {
      page: this.currentPage,
      pageSize: this.pageSize,
      roomNumber: this.activeFilters.roomNumber || null,
      requestedById: this.activeFilters.requestedById || null,
      assignedToId: this.isTeamLeaderUser ? this.activeFilters.assignedToId : employeeId,
      status: this.activeFilters.status || 'All',
      listNumber: this.activeFilters.listNumber || null,
      extraItemIds: this.activeFilters.extraWorkItemIds && this.activeFilters.extraWorkItemIds.length ? this.activeFilters.extraWorkItemIds : [],
      IsToday: this.isToday,
      fromDate: formatLocalDateText(this.activeFilters.fromDate) || null,
      toDate: formatLocalDateText(this.activeFilters.toDate),
      fromTime: this.activeFilters.fromTime || null,
      toTime: this.activeFilters.toTime || null,
      isTeamLeader: this.isTeamLeaderUser
    };

    const historySub = this.extraWorkRequestService
      .getPagedExtraWorkRequests(requestPayload)
      .subscribe({
        next: (response: PagedResponse<ExtraWorkRequestDto>) => {
          this.extrWorkRequests = response.data || []; 
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

  onFilterCriteriaChanged(payload: ExtraWorkRequestFilterPayload): void {
    this.activeFilters = payload;
    
    const formatLocalDateText = (dateInput: any): string | null => {
      if (!dateInput) return null;
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return null;

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    };

    this.todayStr = new Date().toLocaleDateString('en-CA');

    this.fromStr = this.activeFilters?.fromDate ? formatLocalDateText(this.activeFilters.fromDate) : null;
    this.toStr = this.activeFilters?.toDate ? formatLocalDateText(this.activeFilters.toDate) : null;

    const isFromEmpty = !this.fromStr || this.fromStr.trim() === '';
    const isToEmpty = !this.toStr || this.toStr.trim() === '';

    if (isFromEmpty && isToEmpty) {
      this.isToday = true;
    } else if (this.fromStr === this.todayStr && this.toStr === this.todayStr) {
      this.isToday = true;
    } else {
      this.isToday = false;
    }

    this.currentPage = 1; 
    this.isSearching = true;
    this.fetchHistoryPage();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1; 
    this.fetchHistoryPage();
  }

  // 🟢 2. HELPER: Read current form states directly from UI component context safely
  private syncCurrentSearchFilters(): void {
    if (this.searchComponent && this.searchComponent.filterForm) {
      // Pull current visible selection values directly from your reactive input bindings
      const currentFormValue = this.searchComponent.filterForm.value;
      
      this.activeFilters = {
        ...this.activeFilters,
        roomNumber: currentFormValue.roomId || null,
        listNumber: currentFormValue.listNumber || null,
        status: currentFormValue.status || 'All',
        extraWorkItemIds: currentFormValue.extraItemIds || [],
        assignedToId: currentFormValue.assignedToId || null,
        requestedById: currentFormValue.requestedById || null,
        fromDate: currentFormValue.fromDate || null,
        toDate: currentFormValue.toDate || null,
        fromTime: currentFormValue.fromTime || null,
        toTime: currentFormValue.toTime || null
      };
    }
  }

  selectTodayTab(): void {
    this.isSearching = true;
    this.isToday = true;
    
    // Sync other parameters (List Number, Room, Status, etc.) so they are preserved
    this.syncCurrentSearchFilters();
    
    // Clear out date range properties exclusively since we are moving back to absolute today tab
    this.activeFilters.fromDate = null;
    this.activeFilters.toDate = null;
    this.fromStr = null;
    this.toStr = null;

    // Reset date picker input boxes visually inside the child search control UI if reference exists
    if (this.searchComponent && this.searchComponent.filterForm) {
      this.searchComponent.filterForm.patchValue({
        fromDate: null,
        toDate: null
      }, { emitEvent: false });
    }

    this.currentPage = 1;
    this.fetchHistoryPage();
  }

  selectPastTab(): void {
    this.isSearching = true;
    this.isToday = false;

    // 🟢 3. Preserve selection states across tabs instantly
    this.syncCurrentSearchFilters();

    this.currentPage = 1;
    this.fetchHistoryPage();
  }

  handleStatusUpdate(event: { requestId: number, currentStatus: string, newStatus: string }): void {
    const current = event.currentStatus;
    const next = event.newStatus;

    if (this.updatingRequestIds.has(event.requestId)) return;
    if (current === next) return;

    if (current === 'Pending' && next !== 'Acknowledge') {
      alert('Cannot change status! A pending request must be "Acknowledged" before any other actions can be taken.');
      return;
    }

    const payload: UpdateExtraWorkRequestDto = {
      status: event.newStatus,
      updatedById: this.session.id || this.session.employeeId
    };

    this.updatingRequestIds.add(event.requestId);

    this.extraWorkRequestService.updateExtraWorkRequestStatus(event.requestId, payload).subscribe({
      next: () => {
        this.fetchHistoryPage();
        this.updatingRequestIds.delete(event.requestId);
      },
      error: (err) => {
        console.error('Failed to update status:', err);
        this.fetchHistoryPage();
        this.updatingRequestIds.delete(event.requestId);
      }
    });
  }

  routeToExtraWorkRequest() {
    this.router.navigate(['/workspace/extra-work-request-form']);
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
  }
}
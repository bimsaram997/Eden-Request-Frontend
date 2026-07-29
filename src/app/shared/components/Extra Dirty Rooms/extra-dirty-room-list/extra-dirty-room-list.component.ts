import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../../utils/material-imports';
import { Router } from '@angular/router';
import { ExtraDirtRommSearchComponent } from '../extra-dirt-romm-search/extra-dirt-romm-search.component';
import { ExtraDirtyFilterPayload, ExtraDirtyReportDto } from '../../../../models/extra-dirty-rooms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { NotificationServiceService } from '../../../../services/notification-service.service';
import { PagedResponse } from '../../../../models/request.model';
import { ExtraDirtyRoomService } from '../../../../services/extra-dirty-room.service';
import { ExtraDirtyRoomTableComponent } from '../extra-dirty-room-table/extra-dirty-room-table.component';
import { A11yModule } from "@angular/cdk/a11y";

@Component({
  selector: 'app-extra-dirty-room-list',
  standalone: true,
  imports: [MATERIAL_COMPONENTS, ExtraDirtRommSearchComponent, ExtraDirtyRoomTableComponent, A11yModule],
  templateUrl: './extra-dirty-room-list.component.html',
  styleUrl: './extra-dirty-room-list.component.css'
})
export class ExtraDirtyRoomListComponent implements OnInit, OnDestroy {
  @ViewChild(ExtraDirtRommSearchComponent) searchComponent!: ExtraDirtRommSearchComponent;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  activeFilters: ExtraDirtyFilterPayload = {
    roomNumber: null,
    reportedById: null,
    fromDate: null,
    toDate: null,
    fromTime: null, 
    toTime: null, 
    isToday: true,
 
  };
  private subs: any[] = [];
  session: any;
  isTeamLeaderUser!: boolean;
  isSearching = false;
  currentPage = 1;
  pageSize = 6;
  totalRecords: number = 0;
  isToday: boolean = true;
  
  extraDirtyReports: ExtraDirtyReportDto[] = [];
  updatingReportIds = new Set<number>();
  fromStr!: string | null;
  toStr!: string | null;
  todayStr!: string;

  constructor(
    private router: Router,
    private notificationService: NotificationServiceService,
    private extraDirtyReportService: ExtraDirtyRoomService // Replace 'any' with the actual service type
  ) { }

  ngOnInit(): void {
    this.session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeaderUser = (this.session.role || this.session.userRole) === 'TeamLeader';
this.fetchHistoryPage();
    this.changeDetection();
    this.selectTodayTab();
  }

  changeDetection(): void {
    // if (this.notificationService.housekeeperNewExtraDirty$) {
    //   const reportSub = this.notificationService.housekeeperNewExtraDirty$.subscribe({
    //     next: () => this.fetchHistoryPage(),
    //     error: (err: any) => console.error('SignalR stream error:', err)
    //   });
    //   this.subs.push(reportSub);
    // }
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
      reportedById: this.isTeamLeaderUser ? (this.activeFilters.reportedById || null) : employeeId,
      isToday: this.isToday,
      fromDate: formatLocalDateText(this.activeFilters.fromDate) || null,
      toDate: formatLocalDateText(this.activeFilters.toDate) || null,
      fromTime: this.activeFilters.fromTime || null,
      toTime: this.activeFilters.toTime || null,
      isTeamLeader: this.isTeamLeaderUser
    };

    const historySub = this.extraDirtyReportService
      .getPagedExtraDirtyReports(requestPayload)
      .subscribe({
        next: (response: PagedResponse<ExtraDirtyReportDto>) => {
          this.extraDirtyReports = response.data || []; 
          this.totalRecords = response.totalCount || 0;
          this.isSearching = false;
        },
        error: (err: any) => {
          console.error('Failed fetching dirty room reports:', err);
          this.isSearching = false;
        }
      });

    this.subs.push(historySub);
  }

  private resetPaginationToFirstPage(): void {
    this.currentPage = 1;
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  onFilterCriteriaChanged(payload: ExtraDirtyFilterPayload): void {
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

    this.resetPaginationToFirstPage();
    this.isSearching = true;
    this.fetchHistoryPage();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1; 
    this.fetchHistoryPage();
  }

  private syncCurrentSearchFilters(): void {
    if (this.searchComponent && this.searchComponent.filterForm) {
      const currentFormValue = this.searchComponent.filterForm.value;
      
      this.activeFilters = {
        ...this.activeFilters,
        roomNumber: currentFormValue.roomId || null,
        reportedById: currentFormValue.reportedById || null,
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
    
    this.syncCurrentSearchFilters();
    
    this.activeFilters.fromDate = null;
    this.activeFilters.toDate = null;
    this.fromStr = null;
    this.toStr = null;

    if (this.searchComponent && this.searchComponent.filterForm) {
      this.searchComponent.filterForm.patchValue({
        fromDate: null,
        toDate: null
      }, { emitEvent: false });
    }

    this.resetPaginationToFirstPage();
    this.fetchHistoryPage();
  }

  selectPastTab(): void {
    this.isSearching = true;
    this.isToday = false;

    this.syncCurrentSearchFilters();
    this.resetPaginationToFirstPage();
    this.fetchHistoryPage();
  }

  handleViewDetails(report: ExtraDirtyReportDto): void {
    console.log('Viewing report details:', report);
  }

  handleOpenMediaModal(report: ExtraDirtyReportDto): void {
    console.log('Open popup for report media:', report.mediaFiles);
  }

  routeToCreateReport() {
    this.router.navigate(['/workspace/extra-dirty-report-form']);
  }



  routeToExtraDirtyRoom() {
    this.router.navigate(['/workspace/extra-dirty-room-form']);
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
  }

}

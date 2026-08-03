import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../../utils/material-imports';
import { ExtraDirtyFilterPayload } from '../../../../models/extra-dirty-rooms';
import { Employee, EmployeeDto } from '../../../../models/employee';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { setupDateTimeSync } from '../../../utils/date-time-filter.utils';

@Component({
  selector: 'app-extra-dirt-romm-search',
  standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './extra-dirt-romm-search.component.html',
  styleUrl: './extra-dirt-romm-search.component.css'
})
export class ExtraDirtRommSearchComponent implements OnInit, OnDestroy {
  @Input() isSearching: boolean = false;
  @Output() filtersChanged = new EventEmitter<ExtraDirtyFilterPayload>();
  maxDate: Date = new Date();
  availableRooms: string[] = ['101', '102', '103', '201', '202', '304', '305', '401'];
  housekeepersList: Employee[] = [];
  teamLeaderList: Employee[] = [];
  isTeamLeader: boolean = false;
  filterForm!: FormGroup;
  private subs: any[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) { }



  ngOnInit(): void {
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeader = (session.role || session.userRole) === 'TeamLeader';
    this.createRequestSearchForm();
    setupDateTimeSync(this.filterForm, this.subs);
    this.loadEmployee();
  }

  createRequestSearchForm() {
    this.filterForm = this.fb.group({
      reportedById: [''],
      roomNumber: [''],
      fromDate: [null],
      toDate: [null],
      fromTime: [{ value: '', disabled: true }],
      toTime: [{ value: '', disabled: true }]
    });
  }

  loadEmployee(): void {
    const emSub = this.authService.loadAllEmployees().subscribe({
      next: (data) => {
        this.housekeepersList = data.filter((emp: EmployeeDto) => emp.role === 'Housekeeper');
        this.teamLeaderList = data.filter((emp: EmployeeDto) => emp.role === 'TeamLeader');
      },
      error: (err) => console.error('Error fetching employees:', err)
    });
    this.subs.push(emSub);
  }

  applyFilters(): void {
    const values = this.filterForm.value;
    const payload: ExtraDirtyFilterPayload = {
      roomNumber: values.roomNumber || null,
      reportedById: values.reportedById || null,
      fromDate: values.fromDate || null,
      toDate: values.toDate || null,
      fromTime: values.fromTime || null,
      toTime: values.toTime || null,
      isToday: null
    };

    this.filtersChanged.emit(payload);
  }

  resetFilters(): void {
    this.filterForm.reset({
      roomNumber: '',
      reportedById: null,
      fromTime: [{ value: '', disabled: true }],
      toTime: [{ value: '', disabled: true }]
    });
    this.applyFilters();
  }

  private setupDateRangeListener(): void {

    this.filterForm.valueChanges.subscribe(() => {
      const { fromDate, toDate } = this.filterForm.value;
      const hasDateSelected = !!fromDate || !!toDate;

      const fromTimeCtrl = this.filterForm.get('fromTime');
      const toTimeCtrl = this.filterForm.get('toTime');

      if (hasDateSelected) {

        if (fromTimeCtrl?.disabled) fromTimeCtrl.enable({ emitEvent: false });
        if (toTimeCtrl?.disabled) toTimeCtrl.enable({ emitEvent: false });
      } else {

        if (fromTimeCtrl?.enabled) {
          fromTimeCtrl.reset('', { emitEvent: false });
          fromTimeCtrl.disable({ emitEvent: false });
        }
        if (toTimeCtrl?.enabled) {
          toTimeCtrl.reset('', { emitEvent: false });
          toTimeCtrl.disable({ emitEvent: false });
        }
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

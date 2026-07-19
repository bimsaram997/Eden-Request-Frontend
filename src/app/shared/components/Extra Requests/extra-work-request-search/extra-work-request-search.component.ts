import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ExtendedFilterPayload, ExtraWorkRequestFilterPayload } from '../../../../models/DTO';
import { Employee, EmployeeDto } from '../../../../models/class';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { ExtraWorkItems } from '../../../../models/extra-work-items';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ExtraWorkItemService } from '../../../../services/extra-work-item.service';
import { ExtraWorkRequestService } from '../../../../services/extra-work-request.service';
import { AuthService } from '../../../../services/auth.service';
import { MATERIAL_COMPONENTS } from '../../../utils/material-imports';

@Component({
  selector: 'app-extra-work-request-search',
  standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './extra-work-request-search.component.html',
  styleUrl: './extra-work-request-search.component.css'
})
export class ExtraWorkRequestSearchComponent implements OnInit, OnDestroy {
  @Input() isSearching: boolean = false;
  @Output() filtersChanged = new EventEmitter<ExtraWorkRequestFilterPayload>();
maxDate: Date = new Date();
  listRoomsMap: { [key: number]: string[] } = {
    10: ['101', '102', '103'],
    20: ['201', '202', '203']
  };

  housekeepersList: Employee[] = [];
  teamLeaderList: Employee[] = [];
  statusesList = ['All', 'Pending', 'Acknowledge', 'Done',];

  listNumbers: number[] = [10, 20];
  availableRooms: string[] = [];
  extraWorkItems: ExtraWorkItems[] = [];
  itemSearchQuery: string = '';
  isTeamLeader: boolean = false; // Placeholder for team leader status, adjust as needed

  filterForm!: FormGroup;

  private subs: any[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private extraWorkItemService: ExtraWorkItemService,
    private extraWorkRequestService: ExtraWorkRequestService,
    private authService: AuthService
  ) { }



  ngOnInit(): void {
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeader = (session.role || session.userRole) === 'TeamLeader';
    this.createRequestSearchForm();

    this.loadEmployee();
    this.loadExtraWorkItems();

  }



  createRequestSearchForm() {
    this.filterForm = this.fb.group({
      listNumber: [''],
      roomId: [''],
      extraItemIds: [[]],
      status: [],
      requestedById: [null],
      assignedToId: [],
      fromDate: [null],
      toDate: [null],
      fromTime: [null],
      toTime: [null],
    });
  }



  loadEmployee(): void {
    const emSub = this.authService.loadAllEmployees().subscribe({
      next: (data) => {
        // Filter the data array to only include Housekeepers
        this.housekeepersList = data.filter((emp: EmployeeDto) => emp.role === 'Housekeeper');
        this.teamLeaderList = data.filter((emp: EmployeeDto) => emp.role === 'TeamLeader');
        // Moving the log inside the next block because subscribe is asynchronous
        console.log('Housekeepers list loaded:', this.housekeepersList);
      },
      error: (err) => console.error('Error fetching employees:', err)
    });

    this.subs.push(emSub);
  }

  loadExtraWorkItems(): void {
    const itemSub = this.extraWorkItemService.getAllExtraWorkItems().subscribe({
      next: (data) => {
        this.extraWorkItems = data;
      },
      error: (err) => console.error('Error fetching extra work items:', err)
    });

    this.subs.push(itemSub);
  }

  onListChange(): void {
    const selectedList = this.filterForm.get('listNumber')?.value;
    this.filterForm.get('roomNumber')?.setValue('');
    if (selectedList && this.listRoomsMap[selectedList]) {
      this.availableRooms = this.listRoomsMap[selectedList];
    } else {
      this.availableRooms = [];
    }
  }

  applyFilters(): void {
    const values = this.filterForm.value;

    // 2. Map properties strictly to match the ExtendedFilterPayload layout rules
    const payload: ExtraWorkRequestFilterPayload = {
      roomNumber: values.roomId || null,
      listNumber: values.listNumber ? parseInt(values.listNumber, 10) : null,
      status: values.status || 'All',
      requestedById: values.requestedById || null,
      assignedToId: values.assignedToId || null,
      fromDate: values.fromDate || null,
      toDate: values.toDate || null,
      extraWorkItemIds: values.extraItemIds && values.extraItemIds.length ? values.extraItemIds : [],
      fromTime: values.fromTime || null,
      toTime: values.toTime || null,
      isToday: null // This can be set based on your specific logic or UI input 
    };

    this.filtersChanged.emit(payload);
  }

  resetFilters(): void {
    this.filterForm.reset({
      listNumber: '',
      roomNumber: '',
      statuses: [],
      itemIds: [],
      rquestedById: [],
      AssignedToId: [],
      fromDate: null,
      toDate: null
    });
    this.applyFilters();
  }


  ngOnDestroy(): void {
    this.subs.forEach((sub: any) => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
  }
}

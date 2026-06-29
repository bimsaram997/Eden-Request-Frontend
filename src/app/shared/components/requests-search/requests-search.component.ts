import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemService } from '../../../services/item.service';
import { ItemCategoryService } from '../../../services/item-category.service';
import { Subscription } from 'rxjs';
import { MATERIAL_COMPONENTS } from '../../utils/material-imports';
import { ExtendedFilterPayload } from '../../../models/DTO';
import { AuthService } from '../../../services/auth.service';
import { EmployeeDto } from '../../../models/class';

@Component({
  selector: 'app-requests-search',
  standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './requests-search.component.html',
  styleUrl: './requests-search.component.css'
})
export class RequestsSearchComponent implements OnInit {
  @Output() filtersChanged = new EventEmitter<ExtendedFilterPayload>();

  listRoomsMap: { [key: number]: string[] } = {
    10: ['101', '102', '103'],
    20: ['201', '202', '203']
  };

  housekeepersList:EmployeeDto[] = [];  

  statusesList = ['All', 'Pending', 'Approved', 'Delivered', 'Rejected'];

  listNumbers: number[] = [10, 20];
  availableRooms: string[] = [];
  categoriesList: any[] = [];
  availableItems: any[] = [];
  itemSearchQuery: string = '';
  isTeamLeader: boolean = false; // Placeholder for team leader status, adjust as needed

  filterForm!: FormGroup;

  private subs = new Subscription();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private itemService: ItemService,
    private itemCategoryService: ItemCategoryService,
    private authService: AuthService
  ) { }



  ngOnInit(): void {
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeader = (session.role || session.userRole) === 'TeamLeader';
    this.createRequestSearchForm();
    this.loadCategories();
    this.loadEmployee();

  }

  

  createRequestSearchForm() {
    this.filterForm = this.fb.group({
      listNumber: [''],
      roomNumber: [''],
      notes: [''],
      requestedItems: this.fb.array([]),

      // Multi-select tracking form arrays are initialized with blank arrays [] instead of null strings
      status: [],
      categoryId: [],
      itemIds: [[]],
      targetEmployeeId: [],
      fromDate: [null],
      toDate: [null],
      fromTime: [null],
      toTime: [null]
    });
  }

  loadEmployee(): void {
  const emSub = this.authService.loadAllEmployees().subscribe({
    next: (data) => {
      // Filter the data array to only include Housekeepers
      this.housekeepersList = data.filter((emp: EmployeeDto) => emp.role === 'Housekeeper');
      
      // Moving the log inside the next block because subscribe is asynchronous
      console.log('Housekeepers list loaded:', this.housekeepersList);
    },
    error: (err) => console.error('Error fetching employees:', err)
  });
  
  this.subs.add(emSub);
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

  loadCategories(): void {
    const catSub = this.itemCategoryService.getItemCategories().subscribe({
      next: (data) => this.categoriesList = data,
      error: (err) => console.error('Error fetching categories:', err)
    });
    this.subs.add(catSub);
  }

  onCategoryChange(): void {
    const chosenCategory = this.filterForm.get('categoryId')?.value;
    this.filterForm.get('item')?.setValue('');
    this.availableItems = [];
    this.itemSearchQuery = '';

    if (!chosenCategory) return;

    this.itemService.getItemsByCategory(chosenCategory).subscribe({
      next: (items) => this.availableItems = items,
      error: (err) => console.error('Error loading items:', err)
    });
  }

  get requestedItems(): FormArray {
    return this.filterForm.get('requestedItems') as FormArray;
  }

  applyFilters(): void {
    const values = this.filterForm.value;

    // 2. Map properties strictly to match the ExtendedFilterPayload layout rules
    const payload: ExtendedFilterPayload = {
      roomSearch: values.roomNumber || null,
      roomListId: values.listNumber ? parseInt(values.listNumber, 10) : null,
      status: values.status || 'All',
      categoryId: values.categoryId || null,
      targetEmployeeId: values.targetEmployeeId && (!Array.isArray(values.targetEmployeeId) || values.targetEmployeeId.length > 0) 
      ? parseInt(values.targetEmployeeId.toString(), 10) 
      : null,
      fromDate: values.fromDate || null,
      toDate: values.toDate || null,
      itemIds: values.itemIds && values.itemIds.length ? values.itemIds : [],
      fromTime: values.fromTime || null,
      toTime: values.toTime || null

    };

    this.filtersChanged.emit(payload);
  }

  resetFilters(): void {
    this.filterForm.reset({
      listNumber: '',
      roomNumber: '',
      notes: '',
      statuses: [],
      categoryIds: [],
      itemIds: [],
      targetEmployeeId: [],
      fromDate: null,
      toDate: null
    });
    this.requestedItems.clear();
    this.applyFilters();
  }








}

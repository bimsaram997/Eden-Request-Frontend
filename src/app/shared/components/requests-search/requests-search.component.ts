import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ItemService } from '../../../services/item.service';
import { ItemCategoryService } from '../../../services/item-category.service';
import { Subscription } from 'rxjs';
import { MATERIAL_COMPONENTS } from '../../utils/material-imports';
import { ExtendedFilterPayload } from '../../../models/DTO';

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

  housekeepersList = [
    { id: 42, displayName: 'Anna Johansson' },
    { id: 43, displayName: 'Lars Virtanen' }
  ];

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
  ) { }



  ngOnInit(): void {
    this.createRequestSearchForm();
    this.loadCategories();

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
      targetEmployeeIds: [],
      fromDate: [null],
      toDate: [null],
      fromTime: [null],
      toTime: [null]
    });
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
      targetEmployeeId: values.targetEmployeeId || null,
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
      targetEmployeeIds: [],
      fromDate: null,
      toDate: null
    });
    this.requestedItems.clear();
    this.applyFilters();
  }








}

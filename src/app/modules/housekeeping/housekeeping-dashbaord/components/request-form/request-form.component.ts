import { Component, OnDestroy, OnInit } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../../../../shared/utils/material-imports';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ItemService } from '../../../../../services/item.service';
import { ItemCategoryService } from '../../../../../services/item-category.service';
import { BulkLine, PlaceBulkRequest } from '../../../../../models/request';
import { RequestService } from '../../../../../services/request.service';

@Component({
  selector: 'app-request-form',
  standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './request-form.component.html',
  styleUrl: './request-form.component.css'
})
export class RequestFormComponent implements OnInit, OnDestroy {

  // Hardcoded Floor Lists mapping exactly to  backend dictionary structure
  listRoomsMap: { [key: number]: string[] } = {
    10: ['101', '102', '103'], 
    20: ['201', '202', '203']  
  };

  listNumbers: number[] = [10, 20];
  availableRooms: string[] = [];
  categoriesList: any[] = [];
  availableItems: any[] = [];
  itemSearchQuery: string = '';

  requestForm!: FormGroup;
  itemSelectionForm!: FormGroup;
  private subs = new Subscription();


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private itemService: ItemService,
    private itemCategoryService: ItemCategoryService,
    private requestService: RequestService
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.createRequestForm();
  }

  createRequestForm() {
    this.requestForm = this.fb.group({
      listNumber: ['', [Validators.required]],
      roomNumber: ['',],
      notes: [''],
      requestedItems: this.fb.array([]),
    });

    this.itemSelectionForm = this.fb.group({
      categoryName: ['', Validators.required],
      item: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitType: ['Pcs', Validators.required]
    });
  }

  onListChange(): void {
    const selectedList = this.requestForm.get('listNumber')?.value;
    this.requestForm.get('roomNumber')?.setValue('');
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

  get requestedItems(): FormArray {
    return this.requestForm.get('requestedItems') as FormArray;
  }

  onCategoryChange(): void {
    const chosenCategory = this.itemSelectionForm.get('categoryName')?.value;
    this.itemSelectionForm.get('item')?.setValue('');
    this.availableItems = [];
    this.itemSearchQuery = '';

    if (!chosenCategory) return;

    this.itemService.getItemsByCategory(chosenCategory).subscribe({
      next: (items) => this.availableItems = items,
      error: (err) => console.error('Error loading items:', err)
    });
  }

  getFilteredAvailableItems(): any[] {
    if (!this.itemSearchQuery.trim()) {
      return this.availableItems;
    }
    const query = this.itemSearchQuery.toLowerCase();
    return this.availableItems.filter(prod => 
      prod.name.toLowerCase().includes(query)
    );
  }

  addItemToList(): void {
    if (this.itemSelectionForm.invalid) {
      this.itemSelectionForm.markAllAsTouched();
      return;
    }

    if (this.requestedItems.length >= 5) {
      alert('Maximum limit reached. You can only request up to 5 items.');
      return;
    }

    const staged = this.itemSelectionForm.value;

    const isDuplicate = this.requestedItems.controls.some(
      control => control.get('itemId')?.value === staged.item.id
    );

    if (isDuplicate) {
      alert('This item is already in your request list.');
      return;
    }

    this.requestedItems.push(this.fb.group({
      categoryName: [staged.categoryName],
      itemId: [staged.item.id, Validators.required],
      itemName: [staged.item.name],
      quantity: [staged.quantity, [Validators.required, Validators.min(1)]],
      unitType: [staged.unitType, Validators.required]
    }));

    this.itemSelectionForm.patchValue({ item: '', quantity: 1, unitType: 'Pcs' });
    const itemControl = this.itemSelectionForm.get('item');
    if (itemControl) {
      itemControl.markAsUntouched(); 
      itemControl.markAsPristine();  
      itemControl.setErrors(null);   
    }
    this.itemSearchQuery = '';
  }

  removeItemFromList(index: number): void {
    this.requestedItems.removeAt(index);
  }

  onSubmit(): void {
    Object.values(this.requestForm.controls).forEach((control) => {
      control.markAsTouched();
    });

    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    if (this.requestedItems.length === 0) {
      alert('Please add at least one item to your list before dispatching.');
      return;
    }

    const sessionData = localStorage.getItem('scandic_eden_session');
    if (!sessionData) {
      alert('Your session has expired. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = JSON.parse(sessionData);
    const employeeId = currentUser.id || currentUser.employeeId;

    const masterFormValue = this.requestForm.value;

    const itemsPayload: BulkLine[] = this.requestedItems.controls.map(control => {
      return {
        itemId: Number(control.get('itemId')?.value),
        quantity: Number(control.get('quantity')?.value),
        unitType: String(control.get('unitType')?.value)
      };
    });

    const submissionPayload: PlaceBulkRequest = {
      employeeId: Number(employeeId),
      roomListId: Number(masterFormValue.listNumber), 
      roomNumber: masterFormValue.roomNumber ? String(masterFormValue.roomNumber) : null,
      items: itemsPayload,
      notes: masterFormValue.notes ? String(masterFormValue.notes) : ""
    };

    console.log('Sending compiled payload to C# endpoint structure:', submissionPayload);

    this.requestService.placeBulkRequest(submissionPayload).subscribe({
      next: (response) => {
        console.log('Backend successfully tracked request:', response);
        alert('Material request has been successfully dispatched to the Team Leader!');

        this.router.navigate(['/workspace/housekeeper-dashboard']);
      },
      error: (err) => {
        console.error('API endpoint rejected payload connection wrapper:', err);
        alert(err.error || 'Failed to dispatch request. Please try again.');
      }
    });
  }

  backToDashboard() {
    this.router.navigate(['/workspace/housekeeper-dashboard']);
  }



  ngOnDestroy(): void {
    this.subs.unsubscribe();

  }



}

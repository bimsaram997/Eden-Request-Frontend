import { Component } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../../../shared/utils/material-imports';
import { Subscription } from 'rxjs';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExtraWorkRequestService } from '../../../../services/extra-work-request.service';
import { ExtraWorkItemService } from '../../../../services/extra-work-item.service';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { EmployeeDto } from '../../../../models/class';
import { ExtraWorkItems } from '../../../../models/extra-work-items';
import { CreateExtraRequestLineDto, CreateExtraWorkRequestDto } from '../../../../models/extra-work-request';

@Component({
  selector: 'app-extra-work-request-form',
  standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './extra-work-request-form.component.html',
  styleUrl: './extra-work-request-form.component.css'
})
export class ExtraWorkRequestFormComponent {

 
  listRoomsMap: { [key: number]: string[] } = {
    10: ['101', '102', '103'],
    20: ['201', '202', '203']
  };

  listNumbers: number[] = [10, 20];
  availableRooms: string[] = [];

  extraItemSearchQuery: string = '';
  nameSearchQuery: string = '';

  requestForm!: FormGroup;
  extraItemSelectionForm!: FormGroup;
  private subs: any[] = [];
  housekeepersList: EmployeeDto[] = [];
  teamLeaderList: EmployeeDto[] = [];
  extraWorkItems: ExtraWorkItems[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private extraWorkItemService: ExtraWorkItemService,
    private extraWorkRequestService: ExtraWorkRequestService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadEmployee();
    this.loadExtraWorkItems();
    this.createRequestForm();
  }

  createRequestForm() {
    this.requestForm = this.fb.group({
      listNumber: ['', [Validators.required]],
      roomNumber: ['',],
      notes: [''],
      assignedToId: ['', Validators.required],
      requestedItems: this.fb.array([]),
    });

    this.extraItemSelectionForm = this.fb.group({
      extraWorkItem: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],

    });
  }

  get requestedItems(): FormArray {
    return this.requestForm.get('requestedItems') as FormArray;
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
    const selectedList = this.requestForm.get('listNumber')?.value;
    this.requestForm.get('roomNumber')?.setValue('');
    if (selectedList && this.listRoomsMap[selectedList]) {
      this.availableRooms = this.listRoomsMap[selectedList];
    } else {
      this.availableRooms = [];
    }
  }


  getFilteredAvailableItems(): any[] {
    if (!this.extraItemSearchQuery.trim()) {
      return this.extraWorkItems;
    }
    const query = this.extraItemSearchQuery.toLowerCase();
    return this.extraWorkItems.filter(prod =>
      prod.name.toLowerCase().includes(query)
    );
  }

  getFilteredAvailableHousekeepers(): any[] {
    if (!this.nameSearchQuery.trim()) {
      return this.housekeepersList;
    }
    const query = this.nameSearchQuery.toLowerCase();
    const va = this.housekeepersList.filter(prod =>
      prod.name.toLowerCase().includes(query)
    );
    return va;
  }


  addItemToList(): void {
    if (this.extraItemSelectionForm.invalid) {
      this.extraItemSelectionForm.markAllAsTouched();
      return;
    }

    if (this.requestedItems.length >= 5) {
      alert('Maximum limit reached. You can only request up to 5 items.');
      return;
    }

    const staged = this.extraItemSelectionForm.value;

    const isDuplicate = this.requestedItems.controls.some(
      control => control.get('extraWorkItemId')?.value === staged.extraWorkItem.id

    );

    if (isDuplicate) {
      alert('This item is already in your request list.');
      return;
    }

    this.requestedItems.push(this.fb.group({
      extraWorkItemId: [staged.extraWorkItem.id, Validators.required],
      itemName: [staged.extraWorkItem.name, Validators.required],
      quantity: [staged.quantity, [Validators.required, Validators.min(1)]],
    }));

    this.extraItemSelectionForm.patchValue({ extraWorkItemId: '', quantity: 1 });
    const itemControl = this.extraItemSelectionForm.get('extraWorkItemId');
    if (itemControl) {
      itemControl.markAsUntouched();
      itemControl.markAsPristine();
      itemControl.setErrors(null);
    }
    this.extraItemSearchQuery = '';
  }

  onSubmit() {
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
    
        const itemsPayload: CreateExtraRequestLineDto[] = this.requestedItems.controls.map(control => {
          return {
            extraWorkItemId: Number(control.get('extraWorkItemId')?.value),
            quantity: Number(control.get('quantity')?.value),
            
          };
        });
    
        const submissionPayload: CreateExtraWorkRequestDto = {
          roomNumber: masterFormValue.roomNumber,
          requestedById: Number(employeeId),
          listNumber: Number(masterFormValue.listNumber),
          assignedToId: Number(masterFormValue.assignedToId.id),
          notes: masterFormValue.notes ? String(masterFormValue.notes) : "",
          lines: itemsPayload,
          
        };

        console.log(itemsPayload)
        console.log('Sending compiled payload to C# endpoint structure:', submissionPayload);

    this.extraWorkRequestService.placExtraWorkRequest(submissionPayload).subscribe({
      next: (response) => {
        console.log('Backend successfully tracked request:', response);
        alert('Extra work request has been successfully dispatched to the Housekeeper!');

        this.router.navigate(['/workspace/extra-work-requests']);
      },
      error: (err) => {
        console.error('API endpoint rejected payload connection wrapper:', err);
        alert(err.error || 'Failed to dispatch request. Please try again.');
      }
    });
    
  }

  removeItemFromList(index: number): void {
    this.requestedItems.removeAt(index);
  }

   backToDashboard() {
    this.router.navigate(['/workspace/extra-work-requests']);
  }


}

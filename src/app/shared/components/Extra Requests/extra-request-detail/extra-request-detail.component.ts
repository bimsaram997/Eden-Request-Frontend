import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { StatusMenuOption } from '../../../../models/utill-support';
import { RequestStatus } from '../../../../models/enum';
import { Subscription } from 'rxjs';
import { ExtraWorkRequestDto } from '../../../../models/extra-work-request';
import { ExtraWorkRequestService } from '../../../../services/extra-work-request.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MATERIAL_COMPONENTS } from '../../../utils/material-imports';

@Component({
  selector: 'app-extra-request-detail',
  standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './extra-request-detail.component.html',
  styleUrl: './extra-request-detail.component.css'
})
export class ExtraRequestDetailComponent implements OnInit, OnDestroy {
  statusMenuOptions: StatusMenuOption[] = [
    { status: RequestStatus.Pending, label: 'Set to Pending', icon: 'hourglass_empty', color: '#ffc107' },
    { status: RequestStatus.Acknowledged, label: 'Acknowledge Request', icon: 'thumb_up', color: '#0d6efd' },
    { status: RequestStatus.Done, label: 'Done', icon: 'local_shipping', color: '#198754' },
  ];
  private subs: Subscription[] = [];
  extraWorkRequest: ExtraWorkRequestDto | null = null;
  @Input() req!: any;
  @Output() closeDetail = new EventEmitter<void>();
  isTeamLeader = false;
  extraWorkRequetId!: number;
  isLoading: boolean = false;
  session: any;
  loading: boolean = true;
  currentStatus!: string;

  constructor(
    private extraWorkRequestService: ExtraWorkRequestService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    const userRole = this.session.role || this.session.Role;
    this.isTeamLeader = userRole === 'TeamLeader';
    const routeSub = this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.extraWorkRequetId = +idStr;
        this.loadRequestDetails(this.extraWorkRequetId);
      }
    });
    this.subs.push(routeSub);
  }


  loadRequestDetails(extraWorkRequetId: number): void {
    const reqSub = this.extraWorkRequestService.getExtraWorkRequestById(extraWorkRequetId).subscribe({
      next: (data: ExtraWorkRequestDto) => {
        this.extraWorkRequest = data;
        this.currentStatus = data.status;
      },
      error: (err) => {
        console.error('Failed to load item details', err);
      }
    });
    this.subs.push(reqSub);
  }

  handleStatusUpdate(status: string): void {
    if (this.currentStatus === status) return;
    if (this.currentStatus === 'Pending' && status !== 'Acknowledge') {
      alert('Cannot change status! A pending request must be "Acknowledged" before any other actions can be taken.');
      return;
    }
    this.isLoading = true;
    const payload = {
      status: status,
      updatedById: this.session.id || this.session.employeeId
    };
    this.extraWorkRequestService.updateExtraWorkRequestStatus(this.extraWorkRequetId, payload).subscribe({
      next: (response: ExtraWorkRequestDto) => {
        this.loadRequestDetails(response.id);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to update status:', err);
        this.isLoading = false;
      }
    });
  }

  onBack(): void {
    this.closeDetail.emit();
    this.router.navigate(['/workspace/extra-work-requests']);

  }

  ngOnDestroy(): void {
    this.subs.forEach((sub: Subscription) => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
  }
}

import { Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../utils/material-imports';
import { RequestHeader } from '../../../models/class';
import { RequestService } from '../../../services/request.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { StatusMenuOption } from '../../../models/utill-support';
import { RequestStatus } from '../../../models/enum';
import { A11yModule } from "@angular/cdk/a11y";

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [MATERIAL_COMPONENTS, A11yModule],
  templateUrl: './request-detail.component.html',
  styleUrl: './request-detail.component.css'
})
export class RequestDetailComponent implements OnInit, OnDestroy {

  statusMenuOptions: StatusMenuOption[] = [
    { status: RequestStatus.Pending, label: 'Set to Pending', icon: 'hourglass_empty', color: '#ffc107' },
    { status: RequestStatus.Acknowledged, label: 'Acknowledge Request', icon: 'thumb_up', color: '#0d6efd' },
    { status: RequestStatus.Delivered, label: 'Mark Delivered', icon: 'local_shipping', color: '#198754' },
    { status: RequestStatus.Rejected, label: 'Reject Request', icon: 'cancel', color: '#dc3545' }
  ];

  private subs: Subscription[] = [];
requestItem: RequestHeader | null = null;

  @Input() req!: any;
  @Output() closeDetail = new EventEmitter<void>();

  isTeamLeader = false;
  requestId!: number;
  isLoading: boolean = false;
  session: any;
loading: boolean = true; // Initial loading state

  constructor(
    private requestService: RequestService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    const userRole = this.session.role || this.session.Role;
    this.isTeamLeader = userRole === 'TeamLeader';

    // Normal routing setup when component initializes fresh
    const routeSub = this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.requestId = +idStr;
        this.loadRequestDetails(this.requestId);
      }
    });
    this.subs.push(routeSub);
  }

  // 🚀 INTERCEPT BACKGROUND PUSH MESSAGES
  @HostListener('window:message', ['$event'])
  onServiceWorkerMessage(event: MessageEvent) {
    if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
      const newId = event.data.requestId;
      console.log(`Active session push intercepted for request ID: ${newId}`);

      if (newId && newId !== this.requestId) {
        this.requestId = newId;

        // 1. Fetch data for the new request ID directly
        this.loadRequestDetails(this.requestId);

        // 2. Cleanly update the browser URL path without triggering a hard reload or guard check
        this.router.navigate(['/workspace/requests-list', this.requestId], {
          replaceUrl: true
        });
      }
    }
  }

  loadRequestDetails(requestId: number): void {
    const reqSub = this.requestService.getRequestById(requestId).subscribe({
      next: (data: RequestHeader) => {
        this.requestItem = data;
      },
      error: (err) => {
        console.error('Failed to load item details', err);
      }
    });
    this.subs.push(reqSub);
  }

  emitStatusUpdate(status: string): void {

  }

  handleStatusUpdate(status: string): void {
    this.isLoading = true; // Show loading indicator while processing
    const payload = {
      status: status,
      updatedBy: this.session.id || this.session.employeeId
    };

    // 3. LOCK: Drop this request ID into our tracking set to shut down ghost events

    this.requestService.updateRequestStatus(this.requestId, payload).subscribe({
      next: (response: RequestHeader) => {
        this.loadRequestDetails(this.requestId);
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
    if (this.isTeamLeader) {
      this.router.navigate(['/workspace/requests-list']);
    } else {
      this.router.navigate(['/workspace/housekeeper-dashboard']);
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach((sub: Subscription) => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
  }
}
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { StatusMenuOption } from '../../../../models/utill-support';
import { RequestStatus } from '../../../../models/enum';
import { Router } from '@angular/router';
import { MATERIAL_COMPONENTS } from '../../../utils/material-imports';

@Component({
  selector: 'app-extra-work-request-card',
  standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './extra-work-request-card.component.html',
  styleUrl: './extra-work-request-card.component.css'
})
export class ExtraWorkRequestCardComponent {
  @Input({ required: true }) req!: any;
  @Output() statusChanged = new EventEmitter<{ requestId: number, currentStatus: string, newStatus: string }>();
  @Output() viewDetails = new EventEmitter<any>();
  isTeamLeader = false;
  @Input() isLoading = false;

  statusMenuOptions: StatusMenuOption[] = [
    { status: RequestStatus.Pending, label: 'Set to Pending', icon: 'hourglass_empty', color: '#ffc107' },
    { status: RequestStatus.Acknowledged, label: 'Acknowledge Request', icon: 'thumb_up', color: '#0d6efd' },
    { status: RequestStatus.Done, label: 'Done', icon: 'local_shipping', color: '#198754' },
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Check user role from session storage
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    const userRole = session.role || session.Role;

    // Strict evaluation guard: button only shows if they match the exact TeamLeader role string
    this.isTeamLeader = userRole === 'TeamLeader';
  }

  // Simple handler method to broadcast action events upward
  emitStatusUpdate(status: string): void {
    this.statusChanged.emit({ requestId: this.req.id, currentStatus: this.req.status, newStatus: status });
  }
  

  navigateToDetails(event: Event): void {
    event.stopPropagation(); // Stops the expansion panel from expanding/collapsing when clicking the button
    this.viewDetails.emit(this.req);
    this.router.navigate(['/workspace/extra-work-request-detail', this.req.id]);
  }
}

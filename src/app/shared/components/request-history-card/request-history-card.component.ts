import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../utils/material-imports';
import { RequestStatus } from '../../../models/enum';
import { StatusMenuOption } from '../../../models/utill-support';


@Component({
  selector: 'app-request-history-card',
  standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './request-history-card.component.html',
  styleUrl: './request-history-card.component.css'
})
export class RequestHistoryCardComponent {
  @Input({ required: true }) req!: any;
  @Output() statusChanged = new EventEmitter<{ requestId: number, currentStatus: string, newStatus: string }>();

  isTeamLeader = false;

  statusMenuOptions: StatusMenuOption[] = [
    { status: RequestStatus.Pending, label: 'Set to Pending', icon: 'hourglass_empty', color: '#ffc107' },
    { status: RequestStatus.Acknowledged, label: 'Acknowledge Request', icon: 'thumb_up', color: '#0d6efd' },
    { status: RequestStatus.Delivered, label: 'Mark Delivered', icon: 'local_shipping', color: '#198754' },
    { status: RequestStatus.Rejected, label: 'Reject Request', icon: 'cancel', color: '#dc3545' }
  ];

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
}

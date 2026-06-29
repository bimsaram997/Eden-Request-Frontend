import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../utils/material-imports';


@Component({
  selector: 'app-request-history-card',
  standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './request-history-card.component.html',
  styleUrl: './request-history-card.component.css'
})
export class RequestHistoryCardComponent {
@Input({ required: true }) req!: any;
@Output() statusChanged = new EventEmitter<{ requestId: number, newStatus: string }>();

  isTeamLeader = false;

  ngOnInit(): void {
    // Check user role from session storage
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    const userRole = session.role || session.Role; 
    
    // Strict evaluation guard: button only shows if they match the exact TeamLeader role string
    this.isTeamLeader = userRole === 'TeamLeader';
  }

  // Simple handler method to broadcast action events upward
  emitStatusUpdate(status: string): void {
    this.statusChanged.emit({ requestId: this.req.id, newStatus: status });
  }
}

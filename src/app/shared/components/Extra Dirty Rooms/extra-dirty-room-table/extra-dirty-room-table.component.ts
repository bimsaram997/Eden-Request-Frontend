import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../../utils/material-imports';
import { ExtraDirtyReportDto } from '../../../../models/extra-dirty-rooms';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
@Component({
  selector: 'app-extra-dirty-room-table',
  standalone: true,
  imports: [MATERIAL_COMPONENTS, MatIconModule,
    MatBadgeModule],
  templateUrl: './extra-dirty-room-table.component.html',
  styleUrl: './extra-dirty-room-table.component.css'
})
export class ExtraDirtyRoomTableComponent {
  @Input() reports: ExtraDirtyReportDto[] = [];
  @Input() updatingReportIds = new Set<number>();

  @Output() viewDetails = new EventEmitter<ExtraDirtyReportDto>();
  @Output() openMediaModal = new EventEmitter<ExtraDirtyReportDto>();

  displayedColumns: string[] = [
    'id',
    'roomNumber',
    'reportedBy',
    'createdAt',
    'notes',
    'actions'
  ];
  isTeamLeader!: boolean;

  constructor(

  ) { }

  ngOnInit(): void {
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeader = (session.role || session.userRole) === 'TeamLeader';
    if (!this.isTeamLeader){
    this.displayedColumns = this.displayedColumns.filter(
      col =>  col !== 'reportedBy'
    );
    }

  }
  onView(report: ExtraDirtyReportDto): void {
    this.viewDetails.emit(report);
  }

  onOpenMedia(report: ExtraDirtyReportDto): void {
    this.openMediaModal.emit(report);
  }
}

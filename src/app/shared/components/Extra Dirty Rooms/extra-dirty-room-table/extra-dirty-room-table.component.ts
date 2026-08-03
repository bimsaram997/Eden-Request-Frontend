import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../../utils/material-imports';
import { ExtraDirtyReportDto } from '../../../../models/extra-dirty-rooms';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MedialViewerModalComponent } from '../medial-viewer-modal/medial-viewer-modal.component';
@Component({
  selector: 'app-extra-dirty-room-table',
  standalone: true,
  imports: [MATERIAL_COMPONENTS, MatIconModule, MedialViewerModalComponent,
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
  isMediaModalOpen = false;
  selectedMediaFiles: any[] = [];
  selectedRoomNumber: string = '';

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

  handleOpenMediaModal(report: ExtraDirtyReportDto): void {
    if (report?.mediaFiles && report.mediaFiles.length > 0) {
      this.selectedMediaFiles = report.mediaFiles;
      this.selectedRoomNumber = report.roomNumber || 'N/A';
      this.isMediaModalOpen = true;
    }
  }

  closeMediaModal(): void {
    this.isMediaModalOpen = false;
  }

  onOpenMedia(report: ExtraDirtyReportDto): void {
    this.openMediaModal.emit(report);
  }
}

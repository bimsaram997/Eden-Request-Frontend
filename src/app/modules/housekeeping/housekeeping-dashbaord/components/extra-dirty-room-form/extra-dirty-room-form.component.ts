import { Component, OnDestroy, OnInit } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../../../../shared/utils/material-imports';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ExtraDirtyReportResponse } from '../../../../../models/extra-dirty-rooms';
import { ExtraDirtyRoomService } from '../../../../../services/extra-dirty-room.service';

export interface MediaPreview {
  file: File;
  type: 'image' | 'video';
  previewUrl: SafeUrl;
}

@Component({
  selector: 'app-extra-dirty-room-form',
  standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './extra-dirty-room-form.component.html',
  styleUrl: './extra-dirty-room-form.component.css'
})
export class ExtraDirtyRoomFormComponent implements OnInit, OnDestroy{
requestForm!: FormGroup;
  mediaItems: MediaPreview[] = [];
  isSubmitting = false;

  roomSearchQuery = '';
  availableRooms: string[] = ['101', '102', '103', '201', '202', '304', '305', '401'];
  isDesktop = false;
  private readonly apiUrl = 'http://localhost:5000/api/ExtraDirtyReports';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sanitizer: DomSanitizer,
    private extraDirtyRoomService: ExtraDirtyRoomService
  ) {}

  ngOnInit(): void {
    this.isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.requestForm = this.fb.group({
      roomNumber: ['', [Validators.required]],
      notes: ['']
    });
  }


  getFilteredRooms(): string[] {
    if (!this.roomSearchQuery.trim()) return this.availableRooms;
    return this.availableRooms.filter(room =>
      room.toLowerCase().includes(this.roomSearchQuery.toLowerCase())
    );
  }

  triggerMediaAccess(cameraInput: HTMLInputElement, storageInput: HTMLInputElement): void {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      cameraInput.click();
    } else {
      storageInput.click();
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && this.mediaItems.length < 5) {
      Array.from(input.files).forEach((file: File) => {
        if (this.mediaItems.length >= 5) return;

        const isVideo = file.type.startsWith('video/');
        const rawObjectUrl = URL.createObjectURL(file);

        this.mediaItems.push({
          file: file,
          type: isVideo ? 'video' : 'image',
          previewUrl: this.sanitizer.bypassSecurityTrustUrl(rawObjectUrl)
        });
      });
    }
    input.value = '';
  }

  removeMedia(index: number): void {
    this.mediaItems.splice(index, 1);
  }

  backToDashboard(): void {
    this.router.navigate(['/workspace/extra-dirty-rooms']);
  }

 onSubmit(): void {
    if (this.requestForm.invalid) return;

    if (!this.mediaItems || this.mediaItems.length === 0) {
      alert('Please attach at least one photo or video before submitting.');
      return;
    }

    this.isSubmitting = true;

    // Retrieve logged-in housekeeper ID from stored session/token
   const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    const loggedInHousekeeperId = session.id || session.employeeId || 1;

    const formData = new FormData();
    formData.append('roomNumber', this.requestForm.value.roomNumber);
    formData.append('notes', this.requestForm.value.notes || '');
    formData.append('reportedById', loggedInHousekeeperId.toString());

    this.mediaItems.forEach((item) => {
      formData.append('files', item.file, item.file.name);
    });

    // Call service using your exact method signature style
    this.extraDirtyRoomService.placeExtraDiryRoom(formData).subscribe({
      next: (response: ExtraDirtyReportResponse) => {
        this.isSubmitting = false;
        alert(response.message || 'Extra dirty report submitted successfully!');
        this.backToDashboard();
      },
      error: (err) => {
        console.error('Submission failed:', err);
        this.isSubmitting = false;
        alert(err.error?.message || 'Failed to submit report. Please try again.');
      }
    });
  }

    ngOnDestroy(): void {
    this.mediaItems = [];
  }

}

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
export class ExtraDirtyRoomFormComponent implements OnInit, OnDestroy {
  requestForm!: FormGroup;
  mediaItems: MediaPreview[] = [];
  isSubmitting = false;

  roomSearchQuery = '';
  availableRooms: string[] = ['101', '102', '103', '201', '202', '304', '305', '401'];
  isDesktop = false;

  // Supported extensions for iOS/Android fallback when file.type is empty
  private readonly imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp', 'tiff'];
  private readonly videoExtensions = ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi', '3gp', 'qt'];

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

  /**
   * Helper method to reliably identify media type across Mobile (iOS HEIC/MOV) & Desktop
   */
  private determineMediaType(file: File): 'image' | 'video' {
    // 1. Check standard MIME type if browser populated it
    if (file.type) {
      if (file.type.startsWith('video/')) return 'video';
      if (file.type.startsWith('image/')) return 'image';
    }

    // 2. Fallback check by file extension (Crucial for iOS Camera/Gallery files where file.type === "")
    const fileName = file.name || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    if (this.videoExtensions.includes(extension)) {
      return 'video';
    }

    // Default to image for HEIC / photos with missing MIME type
    return 'image';
  }

  /**
   * Safe URL Object generator with cleanup tracking
   */
  private createSafePreviewUrl(file: File): SafeUrl {
    try {
      const rawObjectUrl = URL.createObjectURL(file);
      return this.sanitizer.bypassSecurityTrustUrl(rawObjectUrl);
    } catch {
      // Fallback placeholder if object URL creation fails
      return '';
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const selectedFiles = Array.from(input.files);

    for (const file of selectedFiles) {
      if (this.mediaItems.length >= 5) break;

      const mediaType = this.determineMediaType(file);
      const previewUrl = this.createSafePreviewUrl(file);

      this.mediaItems.push({
        file: file,
        type: mediaType,
        previewUrl: previewUrl
      });
    }

    // Reset input value so user can select the same file again if removed
    input.value = '';
  }

  removeMedia(index: number): void {
    if (index >= 0 && index < this.mediaItems.length) {
      this.mediaItems.splice(index, 1);
    }
  }

  backToDashboard(): void {
    this.router.navigate(['/workspace/extra-dirty-rooms']);
  }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    if (!this.mediaItems || this.mediaItems.length === 0) {
      alert('At least one photo or video evidence is required.');
      return;
    }

    this.isSubmitting = true;

    // Retrieve logged-in housekeeper ID safely
    const sessionStr = localStorage.getItem('scandic_eden_session');
    let loggedInHousekeeperId = 1;
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        loggedInHousekeeperId = session.id || session.employeeId || 1;
      } catch {
        loggedInHousekeeperId = 1;
      }
    }

    const formData = new FormData();
    formData.append('roomNumber', this.requestForm.value.roomNumber);
    formData.append('notes', this.requestForm.value.notes || '');
    formData.append('reportedById', loggedInHousekeeperId.toString());

    this.mediaItems.forEach((item) => {
      formData.append('files', item.file, item.file.name);
    });

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
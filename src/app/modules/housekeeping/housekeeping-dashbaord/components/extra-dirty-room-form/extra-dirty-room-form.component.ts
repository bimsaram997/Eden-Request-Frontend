import { Component, OnDestroy, OnInit } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../../../../shared/utils/material-imports';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ExtraDirtyReportResponse } from '../../../../../models/extra-dirty-rooms';
import { ExtraDirtyRoomService } from '../../../../../services/extra-dirty-room.service';
import imageCompression from 'browser-image-compression';

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

  private determineMediaType(file: File): 'image' | 'video' {
    if (file.type) {
      if (file.type.startsWith('video/')) return 'video';
      if (file.type.startsWith('image/')) return 'image';
    }

    const fileName = file.name || '';
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    if (this.videoExtensions.includes(extension)) {
      return 'video';
    }

    return 'image';
  }

  private createSafePreviewUrl(file: File): SafeUrl {
    try {
      const rawObjectUrl = URL.createObjectURL(file);
      return this.sanitizer.bypassSecurityTrustUrl(rawObjectUrl);
    } catch {
      return '';
    }
  }

  /**
   * Updated to automatically compress iPhone camera photos down to ~1MB / 1920px max dimension
   * This prevents Render's 504 Gateway Timeout!
   */
  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const selectedFiles = Array.from(input.files);

    for (const file of selectedFiles) {
      if (this.mediaItems.length >= 5) break;

      const mediaType = this.determineMediaType(file);
      let fileToSave = file;

      // Compress Images on mobile before saving to state
      if (mediaType === 'image') {
        const compressionOptions = {
          maxSizeMB: 1.0,           // Max size 1 MB
          maxWidthOrHeight: 1920,   // Resize full 4K photos to 1080p/1920p HD
          useWebWorker: true,
          initialQuality: 0.8
        };

        try {
          fileToSave = await imageCompression(file, compressionOptions);
        } catch (err) {
          console.warn('Image compression skipped/failed, using raw file:', err);
          fileToSave = file;
        }
      }

      const previewUrl = this.createSafePreviewUrl(fileToSave);

      this.mediaItems.push({
        file: fileToSave,
        type: mediaType,
        previewUrl: previewUrl
      });
    }

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

    const sessionStr = localStorage.getItem('scandic_eden_session');
    let loggedInHousekeeperId: number | null = null;

    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        loggedInHousekeeperId = session.employeeId || session.id || session.userId || session.user?.id || session.user?.employeeId || null;
      } catch {
        loggedInHousekeeperId = null;
      }
    }

    if (!loggedInHousekeeperId) {
      alert('Your session has expired. Please log in again.');
      this.router.navigate(['/login']);
      return;
    }

    const roomValue = this.requestForm.get('roomNumber')?.value;
    const rawRoomNumber = typeof roomValue === 'object' && roomValue !== null
      ? (roomValue.roomNumber || roomValue.name || roomValue.id || '')
      : String(roomValue || '');

    this.isSubmitting = true;

    const formData = new FormData();

    // Text fields FIRST for iOS WebKit compatibility
    formData.append('roomNumber', rawRoomNumber.trim());
    formData.append('RoomNumber', rawRoomNumber.trim());
    
    formData.append('reportedById', loggedInHousekeeperId.toString());
    formData.append('ReportedById', loggedInHousekeeperId.toString());
    
    formData.append('notes', (this.requestForm.value.notes || '').toString().trim());
    formData.append('Notes', (this.requestForm.value.notes || '').toString().trim());

    // Append binary media files LAST
    this.mediaItems.forEach((item, index) => {
      const rawFile = item.file;
      const isVideo = item.type === 'video';

      const fallbackExt = isVideo ? 'mp4' : 'jpg';
      const fallbackMime = isVideo ? 'video/mp4' : 'image/jpeg';

      const cleanFileName = rawFile.name && rawFile.name.includes('.')
        ? rawFile.name
        : `ios_upload_${index + 1}.${fallbackExt}`;

      const cleanBlob = new File([rawFile], cleanFileName, {
        type: rawFile.type || fallbackMime
      });

      formData.append('files', cleanBlob, cleanFileName);
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
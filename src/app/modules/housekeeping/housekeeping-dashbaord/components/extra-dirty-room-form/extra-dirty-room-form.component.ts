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

  // 1. Extract Session & Employee ID
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

  // 2. EXTRACT ROOM NUMBER SAFELY
  const roomValue = this.requestForm.get('roomNumber')?.value;
  let rawRoomNumber = '';

  if (typeof roomValue === 'object' && roomValue !== null) {
    rawRoomNumber = String(roomValue.roomNumber || roomValue.name || roomValue.id || roomValue.value || '');
  } else if (roomValue !== null && roomValue !== undefined) {
    rawRoomNumber = String(roomValue);
  }

  // Clean raw room string
  rawRoomNumber = rawRoomNumber.replace(/Room\s+/i, '').trim();

  if (!rawRoomNumber) {
    alert('Please select a valid room number.');
    return;
  }

  this.isSubmitting = true;

  // 3. Build FormData
  const formData = new FormData();

  formData.append('roomNumber', rawRoomNumber);
  formData.append('reportedById', loggedInHousekeeperId.toString());
  formData.append('notes', (this.requestForm.value.notes || '').toString().trim());

  // 4. Append media files
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
      const serverMsg = err.error?.errors 
        ? JSON.stringify(err.error.errors) 
        : (err.error?.message || 'Failed to submit report. Please try again.');
      alert(serverMsg);
    }
  });
}
  ngOnDestroy(): void {
    this.mediaItems = [];
  }
}
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

onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) {
    return;
  }

  const files = Array.from(input.files);

  files.forEach((file) => {
    // iOS Safari validation: ensure file has valid size
    if (file.size === 0) {
      console.warn('iOS File captured with zero bytes, skipping:', file.name);
      return;
    }

    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mov') || file.name.endsWith('.mp4');

    this.mediaItems.push({
      file: file,
      type: isVideo ? 'video' : 'image',
      previewUrl: URL.createObjectURL(file) // For preview in UI
    });
  });

  // Clear file input value so user can re-select if needed on iOS
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

async onSubmit(): Promise<void> {
  if (this.requestForm.invalid) {
    this.requestForm.markAllAsTouched();
    return;
  }

  // Filter out any invalid/corrupted files captured by iOS
  const validMediaItems = this.mediaItems.filter(item => item.file && item.file.size > 0);

  if (validMediaItems.length === 0) {
    alert('At least one photo or video evidence is required. If using iPhone camera, please wait a moment for the photo to process.');
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
  let rawRoomNumber = typeof roomValue === 'object' && roomValue !== null
    ? (roomValue.roomNumber || roomValue.name || roomValue.id || roomValue.value || '')
    : String(roomValue || '');
  rawRoomNumber = rawRoomNumber.replace(/Room\s+/i, '').trim();

  this.isSubmitting = true;

  try {
    // -------------------------------------------------------------
    // STEP 1: Post JSON Metadata (Never drops fields on iPhone)
    // -------------------------------------------------------------
    const metadataPayload = {
      roomNumber: rawRoomNumber,
      reportedById: loggedInHousekeeperId,
      notes: (this.requestForm.value.notes || '').toString().trim()
    };

    const metaResponse = await this.extraDirtyRoomService.createReportMetadata(metadataPayload).toPromise();
    const newReportId = metaResponse?.reportId;

    if (!newReportId) {
      throw new Error('Server did not return a valid Report ID.');
    }

    // -------------------------------------------------------------
    // STEP 2: Upload Media Files Linked to `newReportId`
    // -------------------------------------------------------------
   const filesFormData = new FormData();

this.mediaItems.forEach((item, index) => {
  const rawFile = item.file;
  const isVideo = item.type === 'video';
  const extension = isVideo ? 'mp4' : 'jpg';

  // Use existing file name or fall back to a timestamped string
  const fileName = (rawFile.name && rawFile.name.includes('.')) 
    ? rawFile.name 
    : `upload_${Date.now()}_${index + 1}.${extension}`;

  // IMPORTANT: Append rawFile directly! 
  // DO NOT use: new File([rawFile], fileName, ...)
  filesFormData.append('files', rawFile, fileName);
});

// Send via your service
await this.extraDirtyRoomService.uploadReportMedia(newReportId, filesFormData).toPromise();

// Verification check in console:
console.log('Files inside FormData payload:', filesFormData.getAll('files'));

    await this.extraDirtyRoomService.uploadReportMedia(newReportId, filesFormData).toPromise();

    // -------------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------------
    this.isSubmitting = false;
    alert('Report and media submitted successfully!');
    this.backToDashboard();

  } catch (err: any) {
    console.error('Submission failed:', err);
    this.isSubmitting = false;
    const serverMsg = err.error?.message || err.message || 'Failed to submit report or media. Please try again.';
    alert(serverMsg);
  }
}
  ngOnDestroy(): void {
    this.mediaItems = [];
  }
}
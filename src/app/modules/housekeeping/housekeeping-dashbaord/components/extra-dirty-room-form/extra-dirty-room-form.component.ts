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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private extraDirtyRoomService: ExtraDirtyRoomService
  ) { }

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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);
    files.forEach((file) => {
      if (file.size === 0) {
        console.warn('iOS File captured with zero bytes, skipping:', file.name);
        return;
      }
      const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mov') || file.name.endsWith('.mp4');
      this.mediaItems.push({
        file: file,
        type: isVideo ? 'video' : 'image',
        previewUrl: URL.createObjectURL(file) 
      });
    });

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
      const filesFormData = new FormData();
      for (let i = 0; i < validMediaItems.length; i++) {
        const item = validMediaItems[i];
        const rawFile = item.file;
        const isVideo = item.type === 'video';
        const extension = isVideo ? 'mp4' : 'jpeg';
        const fileName = (rawFile.name && rawFile.name.includes('.'))
          ? rawFile.name
          : `upload_${Date.now()}_${i + 1}.${extension}`;

        try {
          const validBlob = await this.readFileAsBlob(rawFile);
          if (validBlob.size === 0) {
            console.warn(`File ${fileName} has 0 bytes after FileReader processing.`);
            continue;
          }
          filesFormData.append('files', validBlob, fileName);
        } catch (err) {
          console.error(`Failed to read file ${fileName} on iOS:`, err);
        }
      }

      if (!filesFormData.has('files')) {
        throw new Error('Could not read image data from your device. Please select the photo again.');
      }
      await this.extraDirtyRoomService.uploadReportMedia(newReportId, filesFormData).toPromise();
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

  private readFileAsBlob(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const mimeType = file.type || 'image/jpeg';
          const blob = new Blob([arrayBuffer], { type: mimeType });
          resolve(blob);
        } catch (e) {
          reject(e);
        }
      };

      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }
  ngOnDestroy(): void {
    this.mediaItems = [];
  }
}


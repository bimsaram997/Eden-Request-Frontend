import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { MediaFile } from '../../../../models/extra-dirty-rooms';



@Component({
  selector: 'app-medial-viewer-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medial-viewer-modal.component.html',
  styleUrl: './medial-viewer-modal.component.css'
})
export class MedialViewerModalComponent {
@Input() mediaFiles: MediaFile[] = [];
  @Input() roomNumber: string = '';
  @Input() isOpen: boolean = false;
  @Output() closeModal = new EventEmitter<void>();

  currentIndex: number = 0;

  get currentMedia(): MediaFile | null {
    return this.mediaFiles[this.currentIndex] || null;
  }

  get currentUrl(): string {
    return this.currentMedia?.url || this.currentMedia?.fileUrl || '';
  }

  isVideo(file: MediaFile | null): boolean {
    if (!file) return false;
    const type = (file.mediaType || file.type || '').toLowerCase();
    const url = (file.url || file.fileUrl || '').toLowerCase();
    return type.includes('video') || url.endsWith('.mp4') || url.endsWith('.webm');
  }

  next(): void {
    if (this.mediaFiles.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.mediaFiles.length;
    }
  }

  prev(): void {
    if (this.mediaFiles.length > 1) {
      this.currentIndex = (this.currentIndex - 1 + this.mediaFiles.length) % this.mediaFiles.length;
    }
  }

  close(): void {
    this.currentIndex = 0;
    this.closeModal.emit();
  }

  // Keyboard navigation support
  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) return;
    if (event.key === 'Escape') this.close();
    if (event.key === 'ArrowRight') this.next();
    if (event.key === 'ArrowLeft') this.prev();
  }
}

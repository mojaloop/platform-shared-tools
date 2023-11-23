import { Directive, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appDropZone]'
})
export class DropZoneDirective {
  @Output() fileDropped = new EventEmitter<FileList>();
  @Output() dragOver = new EventEmitter<boolean>();
  @Output() dragLeave = new EventEmitter<boolean>();

  @HostListener('drop', ['$event']) onDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    this.fileDropped.emit(files || []);
  }

  @HostListener('dragover', ['$event']) onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.dragOver.emit();
  }

  @HostListener('dragleave', ['$event']) onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    this.dragLeave.emit();
  }
}

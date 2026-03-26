/**
 * Pole Edit Modal Component
 * Displays a modal form to view and edit pole properties.
 */

import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Pole } from '../../model/Pole';

@Component({
  selector: 'app-pole-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="edit-overlay" (click)="onBackdropClick($event)">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="poleModalTitle">

        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title-row">
            <i class="bi bi-geo-alt-fill me-2 text-danger"></i>
            <h5 id="poleModalTitle" class="mb-0">Edit Pole</h5>
          </div>
          <button class="btn-icon" (click)="cancel()" title="Close">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body" *ngIf="draft">

          <!-- Read-only info -->
          <div class="field-group mb-3">
            <label class="field-label">ID</label>
            <div class="field-readonly">{{ draft.id }}</div>
          </div>

          <div class="row-fields">
            <div class="field-group">
              <label class="field-label">Position X (lon)</label>
              <div class="field-readonly">{{ draft.position.x | number:'1.6-6' }}</div>
            </div>
            <div class="field-group">
              <label class="field-label">Position Y (lat)</label>
              <div class="field-readonly">{{ draft.position.y | number:'1.6-6' }}</div>
            </div>
          </div>

          <hr class="divider">

          <!-- Editable fields -->
          <div class="row-fields">
            <div class="field-group">
              <label class="field-label" for="poleStrength">Strength (kg)</label>
              <input
                id="poleStrength"
                type="number"
                class="field-input"
                [(ngModel)]="draft.strength"
                min="1"
                step="50"
              />
            </div>
            <div class="field-group">
              <label class="field-label" for="poleHeight">Total Height (m)</label>
              <input
                id="poleHeight"
                type="number"
                class="field-input"
                [(ngModel)]="draft.height"
                min="1"
                step="0.5"
              />
            </div>
          </div>

          <div class="row-fields">
            <div class="field-group">
              <label class="field-label" for="poleAbove">Above-Ground Height (m)</label>
              <input
                id="poleAbove"
                type="number"
                class="field-input"
                [(ngModel)]="draft.aboveGroundHeight"
                min="0"
                step="0.5"
              />
            </div>
            <div class="field-group">
              <label class="field-label" for="poleRotation">Rotation (°)</label>
              <input
                id="poleRotation"
                type="number"
                class="field-input"
                [(ngModel)]="draft.rotation"
                min="0"
                max="359"
                step="1"
              />
            </div>
          </div>

          <!-- Rotation visual -->
          <div class="rotation-preview">
            <div class="compass">
              <div class="compass-needle" [style.transform]="'rotate(' + draft.rotation + 'deg)'"></div>
              <span class="compass-label">N</span>
            </div>
            <span class="rotation-value">{{ draft.rotation }}°</span>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-secondary" (click)="cancel()">Cancel</button>
          <button class="btn-primary" (click)="save()">
            <i class="bi bi-check-lg me-1"></i>Save
          </button>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class PoleEditComponent implements OnChanges {
  @Input() pole!: Pole;
  @Output() saved = new EventEmitter<Pole>();
  @Output() cancelled = new EventEmitter<void>();

  draft!: Pole;

  ngOnChanges(): void {
    if (this.pole) {
      // Work on a shallow copy so edits don't mutate the original until Save
      this.draft = { ...this.pole, position: { ...this.pole.position } } as Pole;
    }
  }

  save(): void {
    this.saved.emit(this.draft);
  }

  cancel(): void {
    this.cancelled.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('edit-overlay')) {
      this.cancel();
    }
  }
}

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
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
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
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      backdrop-filter: blur(2px);
      animation: fadeIn 0.15s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .modal-panel {
      background: #1e2235;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 10px;
      width: 480px;
      max-width: 95vw;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
      animation: slideUp 0.2s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .modal-title-row {
      display: flex;
      align-items: center;
      color: #fff;
    }

    .modal-title-row h5 {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
    }

    .btn-icon {
      background: transparent;
      border: none;
      color: rgba(255,255,255,0.6);
      font-size: 1rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
    }

    .btn-icon:hover {
      color: #fff;
      background: rgba(255,255,255,0.1);
    }

    .modal-body {
      padding: 20px;
    }

    .field-group {
      margin-bottom: 14px;
      flex: 1;
    }

    .field-label {
      display: block;
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: rgba(255,255,255,0.45);
      margin-bottom: 5px;
    }

    .field-readonly {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 5px;
      padding: 7px 10px;
      color: rgba(255,255,255,0.7);
      font-size: 0.85rem;
      font-family: monospace;
      word-break: break-all;
    }

    .field-input {
      width: 100%;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 5px;
      padding: 7px 10px;
      color: #fff;
      font-size: 0.9rem;
      box-sizing: border-box;
      transition: border-color 0.15s;
    }

    .field-input:focus {
      outline: none;
      border-color: rgba(99,179,237,0.7);
      background: rgba(255,255,255,0.1);
    }

    .row-fields {
      display: flex;
      gap: 14px;
    }

    .divider {
      border-color: rgba(255,255,255,0.1);
      margin: 16px 0;
    }

    /* Rotation compass */
    .rotation-preview {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 10px;
      margin-bottom: 4px;
      padding: 10px 12px;
      background: rgba(255,255,255,0.04);
      border-radius: 6px;
    }

    .compass {
      position: relative;
      width: 38px;
      height: 38px;
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .compass-needle {
      position: absolute;
      top: 3px;
      left: 50%;
      transform-origin: bottom center;
      width: 3px;
      height: 14px;
      margin-left: -1.5px;
      background: #e74c3c;
      border-radius: 2px 2px 0 0;
      transition: transform 0.2s ease;
    }

    .compass-label {
      position: absolute;
      top: -1px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 9px;
      color: rgba(255,255,255,0.4);
      line-height: 1;
    }

    .rotation-value {
      color: rgba(255,255,255,0.7);
      font-family: monospace;
      font-size: 0.9rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 14px 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
    }

    .btn-secondary {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.8);
      padding: 8px 18px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.15s;
    }

    .btn-secondary:hover {
      background: rgba(255,255,255,0.14);
    }

    .btn-primary {
      background: #2563eb;
      border: none;
      color: #fff;
      padding: 8px 18px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: background 0.15s;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }
  `]
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
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cancel();
    }
  }
}

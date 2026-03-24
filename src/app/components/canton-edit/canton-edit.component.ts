/**
 * Canton Edit Modal Component
 * Displays a modal panel to view and edit canton details.
 */

import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Canton } from '../../model/Canton';

@Component({
  selector: 'app-canton-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="cantonModalTitle">

        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title-row">
            <i class="bi bi-bezier2 me-2 text-info"></i>
            <h5 id="cantonModalTitle" class="mb-0">Canton Details</h5>
          </div>
          <button class="btn-icon" (click)="cancel()" title="Close">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body" *ngIf="canton">

          <!-- Read-only metadata -->
          <div class="field-group">
            <label class="field-label">ID</label>
            <div class="field-readonly">{{ canton.id }}</div>
          </div>
          
          <hr class="divider">

          <!-- Lines -->
          <div class="lines-section">
            <div class="lines-header">
              <div class="field-label mb-0">Lines</div>
              <button
                class="btn-add-line"
                (click)="addLine()"
                [disabled]="canton.sections.length === 0"
                title="Add a line to this canton">
                <i class="bi bi-plus-lg"></i> Add Line
              </button>
            </div>

            <div class="line-rows" *ngIf="lines.length > 0">
              <div class="line-row" *ngFor="let line of lines; let li = index">
                <span class="line-index">{{ li + 1 }}</span>

                <!-- Type dropdown -->
                <select
                  class="line-type-select"
                  [ngModel]="line.type"
                  (ngModelChange)="onTypeChange(line, $event)">
                  <option value="Type-A">Type-A</option>
                  <option value="Type-B">Type-B</option>
                  <option value="Type-C">Type-C</option>
                </select>

                <!-- LineSection constraints -->
                <span class="ls-chip" *ngFor="let ls of line.lineSections; let si = index"
                  title="Span {{ si + 1 }} constraint">
                  S{{ si + 1 }}: {{ ls.constraint | number:'1.2-2' }}
                </span>

                <!-- Max constraint spinner -->
                <span class="max-constraint-group">
                  <label class="max-constraint-label">Max</label>
                  <input
                    type="number"
                    class="max-constraint-input"
                    [ngModel]="line.maxConstraint"
                    (ngModelChange)="line.maxConstraint = $event"
                    min="0"
                    step="0.1" />
                </span>

                <button class="btn-remove-line" (click)="removeLine(li)" title="Remove line">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>

            <div class="no-lines" *ngIf="lines.length === 0">
              No lines added yet.
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn-secondary" (click)="cancel()">Close</button>
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
      width: 460px;
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
      margin: 0;
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

    .row-fields {
      display: flex;
      gap: 14px;
    }

    .divider {
      border-color: rgba(255,255,255,0.1);
      margin: 16px 0;
    }

    /* Stats row */
    .stats-row {
      display: flex;
      gap: 10px;
    }

    .stat-card {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      text-align: center;
      padding: 12px 6px;
    }

    .stat-value {
      font-size: 1.3rem;
      font-weight: 700;
      color: #63b3ed;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: rgba(255,255,255,0.4);
    }

    /* Pole list */
    .pole-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pole-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      background: rgba(255,255,255,0.04);
      border-radius: 5px;
      font-size: 0.82rem;
    }

    .pole-index {
      width: 20px;
      text-align: center;
      color: rgba(255,255,255,0.3);
      flex-shrink: 0;
      font-weight: 600;
    }

    .pole-id {
      font-family: monospace;
      color: rgba(255,255,255,0.65);
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .pole-meta {
      font-family: monospace;
      font-size: 0.75rem;
      color: rgba(255,255,255,0.35);
      flex-shrink: 0;
    }

    /* Section list */
    .section-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .section-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 10px;
      background: rgba(255,255,255,0.04);
      border-radius: 5px;
      font-size: 0.82rem;
    }

    .section-label {
      color: rgba(255,255,255,0.45);
      font-size: 0.78rem;
    }

    .section-length {
      font-family: monospace;
      color: #68d391;
      font-weight: 600;
    }

    /* Lines section */
    .lines-section {
      margin-top: 4px;
    }

    .lines-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .btn-add-line {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(99,179,237,0.15);
      border: 1px solid rgba(99,179,237,0.4);
      color: #63b3ed;
      padding: 5px 12px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 0.78rem;
      font-weight: 600;
      transition: background 0.15s;
    }

    .btn-add-line:hover:not(:disabled) {
      background: rgba(99,179,237,0.28);
    }

    .btn-add-line:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .line-rows {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .line-row {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      padding: 8px 10px;
      flex-wrap: wrap;
    }

    .line-index {
      width: 22px;
      text-align: center;
      color: rgba(255,255,255,0.3);
      font-weight: 700;
      font-size: 0.82rem;
      flex-shrink: 0;
    }

    .line-type-select {
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: #fff;
      border-radius: 5px;
      padding: 5px 8px;
      font-size: 0.82rem;
      outline: none;
      cursor: pointer;
    }

    .line-type-select option {
      background: #1e2235;
      color: #fff;
    }

    .ls-chip {
      display: inline-flex;
      align-items: center;
      background: rgba(246,173,85,0.12);
      border: 1px solid rgba(246,173,85,0.25);
      border-radius: 4px;
      padding: 2px 7px;
      font-size: 0.72rem;
      font-family: monospace;
      color: #f6ad55;
      font-weight: 600;
      white-space: nowrap;
    }

    .max-constraint-group {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
    }

    .max-constraint-label {
      font-size: 0.72rem;
      color: rgba(255,255,255,0.45);
      white-space: nowrap;
    }

    .max-constraint-input {
      width: 72px;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: #fff;
      border-radius: 5px;
      padding: 4px 6px;
      font-size: 0.78rem;
      font-family: monospace;
      text-align: right;
      outline: none;
    }

    .max-constraint-input:focus {
      border-color: #63b3ed;
    }

    .btn-remove-line {
      background: transparent;
      border: none;
      color: rgba(255,100,100,0.6);
      cursor: pointer;
      padding: 4px 6px;
      border-radius: 4px;
      font-size: 0.85rem;
      transition: color 0.15s, background 0.15s;
    }

    .btn-remove-line:hover {
      color: #ff6b6b;
      background: rgba(255,100,100,0.12);
    }

    .no-lines {
      font-size: 0.82rem;
      color: rgba(255,255,255,0.3);
      font-style: italic;
      padding: 6px 0;
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
  `]
})
export class CantonEditComponent implements OnChanges {
  @Input() canton!: Canton;
  @Output() cancelled = new EventEmitter<void>();

  totalLength = 0;

  get lines(): Line[] {
    return this.canton?.lines ?? [];
  }

  /** Default constructor parameters keyed by cable type */
  private readonly lineDefaults: Record<string, ConstructorParameters<typeof Line>[0]> = {
    'Type-A': {
      type: 'Type-A',
      sectionArea: 34.4,
      diameter: 7.5,
      weight: 2.76,
      carrierWeight: 0,
      expansionCoefficient: 23e-6,
      elasticityModulus: 6000,
      normalTraction: 10,
    },
    'Type-B': {
      type: 'Type-B',
      sectionArea: 54.6,
      diameter: 9.45,
      weight: 4.39,
      carrierWeight: 0,
      expansionCoefficient: 23e-6,
      elasticityModulus: 6000,
      normalTraction: 12,
    },
    'Type-C': {
      type: 'Type-C',
      sectionArea: 75.5,
      diameter: 11.25,
      weight: 6.07,
      carrierWeight: 0,
      expansionCoefficient: 23e-6,
      elasticityModulus: 6000,
      normalTraction: 14,
    },
  };

  ngOnChanges(): void {
    if (this.canton) {
      this.totalLength = this.canton.sections.reduce((sum, s) => sum + s.length, 0);
    }
  }

  /** Add a new line (Type-A by default) and register it with the canton */
  addLine(): void {
    const line = new Line(this.lineDefaults['Type-A']);
    this.canton.addLine(line);
  }

  /** Remove a line and its associated LineSections */
  removeLine(index: number): void {
    const line = this.canton.lines[index];
    line.lineSections = [];
    this.canton.lines.splice(index, 1);
  }

  /** When the type dropdown changes, update the line's type */
  onTypeChange(line: Line, newType: string): void {
    line.type = newType;
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

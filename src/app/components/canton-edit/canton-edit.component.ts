/**
 * Canton Edit Modal Component
 * Displays a modal panel to view and edit canton details.
 */

import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Canton } from '../../model/Canton';
import { Line } from '../../model/Line';
import { appSettings, Cable } from '../../config/AppSettings';
import { CantonService } from '../../services/canton.service';

@Component({
  selector: 'app-canton-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="edit-overlay" (click)="onBackdropClick($event)">
      <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="cantonModalTitle">

        <!-- Header -->
        <div class="modal-header">
          <div class="modal-title-row">
            <i class="bi bi-bezier2 me-2 text-info"></i>
            <h5 id="cantonModalTitle" class="mb-0">Canton: {{ canton.id }}</h5>
          </div>

              <button
                class="btn-add-line"
                (click)="addLine()"
                title="Add a line to this canton">
                <i class="bi bi-plus-lg"></i> Add Line
              </button>

          <button class="btn-icon" (click)="cancel()" title="Close">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body" *ngIf="canton">

          <!-- Lines -->
          <div class="lines-section">
            
            <div class="line-rows" *ngIf="lines.length > 0">
              <div class="line-row" *ngFor="let line of lines; let li = index">
                <!-- Cable dropdown -->
                <select
                  class="line-type-select"
                  [ngModel]="line.type"
                  (ngModelChange)="onTypeChange(line, $event)">
                  <option *ngFor="let cable of cables" [value]="cable.type">{{ cable.type }}</option>
                </select>

                <!-- LineSections display -->
                <ng-container *ngFor="let ls of line.lineSections">
                  <div class="ls-box" [class.linked]="ls.linked">
                    <div class="ls-values">
                      <div>H: {{ ls.hangingHeight | number:'1.2-2' }}</div>
                      <div>S: {{ ls.sag | number:'1.2-2' }}</div>
                    </div>
                    <svg *ngIf="ls.linked" class="ls-curve" viewBox="0 0 60 30">
                      <path d="M0,5 Q30,30 60,5" stroke="#63b3ed" stroke-width="2" fill="none"/>
                    </svg>
                  </div>
                </ng-container>

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

                <!-- Delete button -->
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
  styles: []
})
export class CantonEditComponent implements OnChanges {
  @Input() canton!: Canton;
  @Output() cancelled = new EventEmitter<void>();

   constructor(
     private cantonService: CantonService
   ) {}

  totalLength = 0;

  get cables(): Cable[] {
    return appSettings.cables;
  }

  get lines(): Line[] {
    return this.canton?.lines ?? [];
  }

  ngOnChanges(): void {
    if (this.canton) {
      this.totalLength = this.canton.sections.reduce((sum, s) => sum + s.length, 0);
    }
  }

  /** Add a new line (Type-A by default) and register it with the canton */
  addLine(): void {
    const line = new Line('ALU 34.4');
    this.canton.addLine(line);
    this.cantonService.updateCanton(this.canton);
  }

  /** Remove a line and its associated LineSections */
  removeLine(index: number): void {
    const line = this.canton.lines[index];
    line.lineSections = [];
    this.canton.lines.splice(index, 1);
    this.cantonService.updateCanton(this.canton);
  }

  /** When the type dropdown changes, update the line's type */
  onTypeChange(line: Line, newType: string): void {
    line.type = newType;
    this.cantonService.updateCanton(this.canton);
  }

  cancel(): void {
    this.cancelled.emit();
    this.cantonService.updateCanton(this.canton);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('edit-overlay')) {
      this.cancel();
    }
  }
}

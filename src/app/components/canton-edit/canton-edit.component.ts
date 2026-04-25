/**
 * Canton Edit Modal Component
 * Displays a modal panel to view and edit canton details.
 *
 * Layout: CSS-grid with poles as columns, lines as rows,
 * LineSections at the intersection of each line and two consecutive poles,
 * and a bottom row for pole bases + details / constraints.
 */

import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Canton } from '../../model/Canton';
import { Line } from '../../model/Line';
import { Pole } from '../../model/Pole';
import { appSettings, Cable } from '../../config/AppSettings';
import { CantonService } from '../../services/canton.service';

@Component({
  selector: 'app-canton-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="edit-overlay" (click)="onBackdropClick($event)">
      <div class="modal-panel modal-dialog modal-dialog-centered" role="dialog">

        <div class="modal-content border-0">

          <!-- Header -->
          <div class="modal-header gap-2 flex-wrap">
            <div class="modal-title-row d-flex align-items-center me-auto">
              <i class="bi bi-bezier2 me-2 text-info"></i>
              <h5 id="cantonModalTitle" class="mb-0">Canton: {{ canton.id }}</h5>
            </div>
            <button
              class="btn btn-outline-info btn-sm d-inline-flex align-items-center gap-1"
              (click)="addLine()"
              title="Add a line to this canton">
              <i class="bi bi-plus-lg"></i>
              <span>Add Line</span>
            </button>
            <button class="btn-icon" (click)="cancel()" title="Close">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <!-- Body: Grid Layout -->
          <div class="modal-body" *ngIf="canton">

              <div class="canton-grid">

                <div class="left-panel d-flex flex-column">
                  <div class="section-grid section-grid-header">
                      <div class="grid-cell section-header text-secondary-emphasis small text-uppercase fw-semibold">
                        <span>Line type</span>
                      </div>
                      <div class="grid-cell section-header text-secondary-emphasis small text-uppercase fw-semibold">
                        <span>Max load</span>
                      </div>
                  </div>

                  <ng-container *ngFor="let line of lines; let li = index">
                    <div class="grid-cell line-details line-row-cell d-flex align-items-center gap-2">
                      <select
                        class="form-select form-select-sm cg-line-select"
                        [ngModel]="line.type"
                        (ngModelChange)="onTypeChange(line, $event)">
                        <option *ngFor="let cable of cables" [value]="cable.type">{{ cable.type }}</option>
                      </select>
                      <input
                        type="number"
                        class="form-control form-control-sm cg-max-input text-end font-monospace"
                        [ngModel]="line.maxConstraint"
                        (ngModelChange)="line.maxConstraint = $event"
                        min="0" step="0.1" />
                    </div>
                  </ng-container>

                  <div class="panel-spacer base-spacer"></div>
                  <div class="panel-spacer details-spacer"></div>
                </div>

                <div class="sections-panel">

                  <!-- Section header: start pole, span length, end pole -->
                  <div class="section-grid section-grid-header">
                    <ng-container *ngFor="let section of canton.sections; let si = index">
                      <div class="grid-cell section-header">
                        <span class="sh-pole">P{{ section.startPole.id }}</span>
                        <span class="sh-length">{{ section.length | number:'1.1-1' }} m</span>
                        <span class="sh-pole">P{{ section.endPole.id }}</span>
                      </div>
                    </ng-container>
                  </div>

                  <ng-container *ngFor="let line of lines; let li = index">
                    <div class="section-grid line-sections-row">
                      <ng-container *ngFor="let section of canton.sections; let si = index">
                        <div class="grid-cell section-cell">
                          <ng-container *ngIf="line.lineSections[si] as ls">

                            <!-- Linked section: left pole, cable sag curve, right pole -->
                            <div class="section-content" *ngIf="ls.linked">
                              <!-- Left half of the pole at the start of the section -->
                              <img class="half-pole-svg" src="assets/canton-edit/half-pole-left.svg" alt="" />
                              <div class="section-curve-wrapper">
                                <!-- Cable curve between the two poles -->
                                <img class="section-curve" src="assets/canton-edit/section-curve.svg" alt="" />
                                <!-- Sag value for this linked line section -->
                                <span class="sag-label">S: {{ ls.sag | number:'1.2-2' }}</span>
                              </div>
                              <!-- Right half of the pole at the end of the section -->
                              <img class="half-pole-svg" src="assets/canton-edit/half-pole-right.svg" alt="" />
                            </div>

                            <!-- Unlinked section: left pole, dashed placeholder span, right pole -->
                            <div class="section-unlinked" *ngIf="!ls.linked">
                              <!-- Left half of the pole at the start of the section -->
                              <img class="half-pole-svg" src="assets/canton-edit/half-pole-left.svg" alt="" />
                              <!-- Dashed line indicating no link between poles -->
                              <img class="section-dashed" src="assets/canton-edit/section-dashed.svg" alt="" />
                              <!-- Right half of the pole at the end of the section -->
                              <img class="half-pole-svg" src="assets/canton-edit/half-pole-right.svg" alt="" />
                            </div>

                          </ng-container>
                        </div>
                      </ng-container>
                    </div>
                  </ng-container>

                  <!-- Pole base row: ground/base graphics under each section boundary -->
                  <div class="section-grid section-grid-base">
                    <ng-container *ngFor="let section of canton.sections; let si = index">
                      <div class="grid-cell section-base">
                        <div class="base-combined d-flex justify-content-between align-items-start w-100">
                          <!-- Left half of the base/pole support -->
                          <img class="half-base-svg" src="assets/canton-edit/half-base-left.svg" alt="" />
                          <!-- Right half of the base/pole support -->
                          <img class="half-base-svg" src="assets/canton-edit/half-base-right.svg" alt="" />
                        </div>
                      </div>
                    </ng-container>
                  </div>

                  <!-- Pole details row: pole metadata and computed constraints -->
                  <div class="section-grid section-grid-details">
                    <ng-container *ngFor="let section of canton.sections; let si = index">
                      <div class="grid-cell section-details">
                        <div class="mt-2 w-100 small">
                          <div class="detail-row d-flex justify-content-between">
                            <span class="detail-lbl text-secondary">ID</span>
                            <span class="detail-val">{{ section.endPole.id }}</span>
                          </div>
                          <div class="detail-row d-flex justify-content-between">
                            <span class="detail-lbl text-secondary">Height</span>
                            <span class="detail-val">{{ section.endPole.aboveGroundHeight | number:'1.1-1' }} m</span>
                          </div>
                          <div class="detail-row d-flex justify-content-between">
                            <span class="detail-lbl text-secondary">Strength</span>
                            <span class="detail-val">{{ section.endPole.strength | number:'1.0-0' }} kg</span>
                          </div>
                          <div class="detail-heading">Constraints</div>
                          <div class="detail-row d-flex justify-content-between">
                            <span class="detail-lbl text-secondary">Mech</span>
                            <span class="detail-val">{{ section.endPole.mechanicalConstraint.intensity | number:'1.2-2' }}</span>
                          </div>
                          <div class="detail-row d-flex justify-content-between">
                            <span class="detail-lbl text-secondary">Wind</span>
                            <span class="detail-val">{{ section.endPole.windConstraint.intensity | number:'1.2-2' }}</span>
                          </div>
                          <div class="detail-row d-flex justify-content-between">
                            <span class="detail-lbl text-secondary">Total</span>
                            <span class="detail-val">{{ section.endPole.totalConstraint.intensity | number:'1.2-2' }}</span>
                          </div>
                        </div>
                      </div>
                    </ng-container>
                  </div>
                  
                </div>

                <div class="side-panel right-panel d-flex flex-column">
                  <div class="panel-spacer header-spacer"></div>

                  <ng-container *ngFor="let line of lines; let li = index">
                    <div class="grid-cell line-action line-row-cell">
                      <button class="btn btn-outline-danger btn-sm" (click)="removeLine(li)" title="Remove line">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </ng-container>

                  <div class="panel-spacer base-spacer"></div>
                  <div class="panel-spacer details-spacer"></div>
                </div>
                
              </div>

          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <button class="btn btn-secondary btn-sm" (click)="cancel()">Close</button>
          </div>

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
  ) { }

  totalLength = 0;

  get cables(): Cable[] {
    return appSettings.cables;
  }

  get lines(): Line[] {
    return this.canton?.lines ?? [];
  }

  get hasSectionScrollbar(): boolean {
    return (this.canton?.poles?.length ?? 0) > 5;
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

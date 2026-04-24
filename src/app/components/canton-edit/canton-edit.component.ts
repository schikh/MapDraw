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

        <!-- Body: Grid Layout -->
        <div class="modal-body" *ngIf="canton">

          <div class="no-lines" *ngIf="lines.length === 0 && canton.poles.length === 0">
            No poles or lines added yet.
          </div>

          <div class="canton-grid-wrapper" *ngIf="canton.poles.length > 0">
            <div class="canton-grid" [style.gridTemplateColumns]="gridTemplateColumns">

              <!-- ═══ Header row: section headers with pole IDs + length ═══ -->
              <div class="grid-cell header-corner"></div>
              <ng-container *ngFor="let section of canton.sections; let si = index">
                <div class="grid-cell section-header">
                  <span class="sh-pole">P{{ section.startPole.id }}</span>
                  <span class="sh-length">{{ section.length | number:'1.1-1' }} m</span>
                  <span class="sh-pole">P{{ section.endPole.id }}</span>
                </div>
              </ng-container>
              <div class="grid-cell header-corner"></div>

              <!-- ═══ Line rows ═══ -->
              <ng-container *ngFor="let line of lines; let li = index">
                <!-- Line type selector (left) -->
                <div class="grid-cell line-label">
                  <select
                    class="cg-line-select"
                    [ngModel]="line.type"
                    (ngModelChange)="onTypeChange(line, $event)">
                    <option *ngFor="let cable of cables" [value]="cable.type">{{ cable.type }}</option>
                  </select>
                </div>

                <!-- Section cells: half-pole-start + curve + half-pole-end -->
                <ng-container *ngFor="let section of canton.sections; let si = index">
                  <div class="grid-cell section-cell">
                    <ng-container *ngIf="line.lineSections[si] as ls">
                      <!-- Linked: half poles + catenary -->
                      <div class="section-content" *ngIf="ls.linked">
                        <!-- Left half pole (right half of start pole) -->
                        <svg class="half-pole-svg" viewBox="6 0 6 44">
                          <rect x="4" y="0" width="4" height="44" fill="#555" rx="1"/>
                          <circle cx="6" cy="22" r="4" fill="#63b3ed" stroke="#2b6cb0" stroke-width="1"/>
                        </svg>
                        <!-- Catenary curve -->
                        <div class="section-curve-wrapper">
                          <svg class="section-curve" viewBox="0 0 100 44" preserveAspectRatio="none">
                            <path d="M0,22 Q50,40 100,22" stroke="#63b3ed" stroke-width="2" fill="none"/>
                          </svg>
                          <span class="sag-label">S: {{ ls.sag | number:'1.2-2' }}</span>
                        </div>
                        <!-- Right half pole (left half of end pole) -->
                        <svg class="half-pole-svg" viewBox="0 0 6 44">
                          <rect x="4" y="0" width="4" height="44" fill="#555" rx="1"/>
                          <circle cx="6" cy="22" r="4" fill="#63b3ed" stroke="#2b6cb0" stroke-width="1"/>
                        </svg>
                      </div>
                      <!-- Unlinked: half poles + dashed line -->
                      <div class="section-unlinked" *ngIf="!ls.linked">
                        <!-- Left half pole (right half of start pole) -->
                        <svg class="half-pole-svg" viewBox="6 0 6 44">
                          <rect x="4" y="0" width="4" height="44" fill="#555" rx="1"/>
                        </svg>
                        <!-- Dashed line -->
                        <svg class="section-dashed" viewBox="0 0 100 44" preserveAspectRatio="none">
                          <line x1="0" y1="22" x2="100" y2="22"
                                stroke="#555" stroke-width="1" stroke-dasharray="6,4"/>
                        </svg>
                        <!-- Right half pole (left half of end pole) -->
                        <svg class="half-pole-svg" viewBox="0 0 6 44">
                          <rect x="4" y="0" width="4" height="44" fill="#555" rx="1"/>
                        </svg>
                      </div>
                    </ng-container>
                  </div>
                </ng-container>

                <!-- Line controls (right) -->
                <div class="grid-cell line-controls">
                  <input
                    type="number"
                    class="cg-max-input"
                    [ngModel]="line.maxConstraint"
                    (ngModelChange)="line.maxConstraint = $event"
                    min="0" step="0.1" />
                  <button class="btn-remove-line" (click)="removeLine(li)" title="Remove line">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </ng-container>

              <!-- ═══ Pole base row (section-centric: half-bases per section) ═══ -->
              <div class="grid-cell pole-base-corner"></div>
              <ng-container *ngFor="let section of canton.sections; let si = index">
                <div class="grid-cell section-base">
                  <div class="section-base-content">
                    <!-- Start pole: right half base -->
                    <div class="half-base">
                      <svg width="22" height="56" viewBox="22 0 22 56">
                        <rect x="19" y="0" width="6" height="38" fill="#78716c" rx="1"/>
                        <rect x="10" y="4" width="24" height="3" fill="#78716c" rx="1"/>
                        <rect x="12" y="38" width="20" height="4" fill="#57534e" rx="1"/>
                        <line x1="4" y1="46" x2="40" y2="46" stroke="#a8a29e"
                              stroke-width="1.5" stroke-dasharray="4,2"/>
                        <line x1="24" y1="49" x2="30" y2="46" stroke="#a8a29e" stroke-width="0.8"/>
                        <line x1="32" y1="49" x2="38" y2="46" stroke="#a8a29e" stroke-width="0.8"/>
                      </svg>
                      <div class="pole-details">
                        <div class="detail-row">
                          <span class="detail-lbl">ID</span>
                          <span class="detail-val">{{ section.startPole.id }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-lbl">Height</span>
                          <span class="detail-val">{{ section.startPole.aboveGroundHeight | number:'1.1-1' }} m</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-lbl">Strength</span>
                          <span class="detail-val">{{ section.startPole.strength | number:'1.0-0' }} kg</span>
                        </div>
                        <div class="detail-heading">Constraints</div>
                        <div class="detail-row">
                          <span class="detail-lbl">Mech</span>
                          <span class="detail-val">{{ section.startPole.mechanicalConstraint.intensity | number:'1.2-2' }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-lbl">Wind</span>
                          <span class="detail-val">{{ section.startPole.windConstraint.intensity | number:'1.2-2' }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-lbl">Total</span>
                          <span class="detail-val">{{ section.startPole.totalConstraint.intensity | number:'1.2-2' }}</span>
                        </div>
                      </div>
                    </div>
                    <!-- End pole: left half base -->
                    <div class="half-base">
                      <svg width="22" height="56" viewBox="0 0 22 56">
                        <rect x="19" y="0" width="6" height="38" fill="#78716c" rx="1"/>
                        <rect x="10" y="4" width="24" height="3" fill="#78716c" rx="1"/>
                        <rect x="12" y="38" width="20" height="4" fill="#57534e" rx="1"/>
                        <line x1="4" y1="46" x2="40" y2="46" stroke="#a8a29e"
                              stroke-width="1.5" stroke-dasharray="4,2"/>
                        <line x1="8"  y1="49" x2="14" y2="46" stroke="#a8a29e" stroke-width="0.8"/>
                        <line x1="16" y1="49" x2="22" y2="46" stroke="#a8a29e" stroke-width="0.8"/>
                      </svg>
                      <div class="pole-details">
                        <div class="detail-row">
                          <span class="detail-lbl">ID</span>
                          <span class="detail-val">{{ section.endPole.id }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-lbl">Height</span>
                          <span class="detail-val">{{ section.endPole.aboveGroundHeight | number:'1.1-1' }} m</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-lbl">Strength</span>
                          <span class="detail-val">{{ section.endPole.strength | number:'1.0-0' }} kg</span>
                        </div>
                        <div class="detail-heading">Constraints</div>
                        <div class="detail-row">
                          <span class="detail-lbl">Mech</span>
                          <span class="detail-val">{{ section.endPole.mechanicalConstraint.intensity | number:'1.2-2' }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-lbl">Wind</span>
                          <span class="detail-val">{{ section.endPole.windConstraint.intensity | number:'1.2-2' }}</span>
                        </div>
                        <div class="detail-row">
                          <span class="detail-lbl">Total</span>
                          <span class="detail-val">{{ section.endPole.totalConstraint.intensity | number:'1.2-2' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ng-container>
              <div class="grid-cell pole-base-corner"></div>

            </div>
          </div>

          <div class="no-lines" *ngIf="canton.poles.length > 0 && lines.length === 0">
            No lines added yet. Click <strong>Add Line</strong> above.
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
    /* ── Grid wrapper (horizontal scroll for many poles) ── */
    .canton-grid-wrapper {
      overflow-x: auto;
      padding: 4px 0;
    }

    .canton-grid {
      display: grid;
      gap: 0;
      align-items: stretch;
      min-width: fit-content;
    }

    /* ── Generic grid cell ── */
    .grid-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
    }

    /* ── Header row ── */
    .header-corner { /* empty corners */ }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.72rem;
      padding: 6px 8px;
      background: rgba(59, 130, 246, 0.06);
      border-radius: 6px 6px 0 0;
    }

    .sh-pole {
      font-weight: 600;
      color: #93c5fd;
    }

    .sh-length {
      color: #a8a29e;
      font-size: 0.68rem;
    }

    /* ── Line label (left column) ── */
    .line-label {
      padding: 4px 8px 4px 0;
      justify-content: flex-end;
    }

    .cg-line-select {
      background: rgba(255,255,255,0.08);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 5px;
      padding: 5px 8px;
      font-size: 0.8rem;
      width: 130px;
      cursor: pointer;
      outline: none;
    }
    .cg-line-select option {
      background: var(--app-bg-panel);
      color: #fff;
    }
    .cg-line-select:focus {
      border-color: var(--app-accent-blue);
    }

    /* ── Section cell (half-poles + curve/dashed) ── */
    .section-cell {
      padding: 2px 0;
      position: relative;
    }

    .section-content {
      display: flex;
      align-items: center;
      width: 100%;
      height: 44px;
    }

    .half-pole-svg {
      width: 8px;
      height: 44px;
      flex-shrink: 0;
    }

    .section-curve-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 0;
    }

    .section-curve {
      width: 100%;
      height: 36px;
    }

    .sag-label {
      font-size: 0.65rem;
      color: #94a3b8;
      margin-top: -2px;
    }

    .section-unlinked {
      display: flex;
      align-items: center;
      width: 100%;
      height: 44px;
    }

    .section-dashed {
      flex: 1;
      height: 36px;
    }

    /* ── Line controls (right column) ── */
    .line-controls {
      padding: 4px 0 4px 8px;
      gap: 6px;
      justify-content: flex-start;
    }

    .cg-max-input {
      width: 68px;
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
    .cg-max-input:focus {
      border-color: var(--app-accent-blue);
    }

    /* ── Pole base row (section-centric) ── */
    .pole-base-corner {
      border-top: 2px solid rgba(100, 116, 139, 0.18);
    }

    .section-base {
      flex-direction: column;
      padding: 10px 4px 8px;
      border-top: 2px solid rgba(100, 116, 139, 0.18);
      border-radius: 0 0 6px 6px;
    }

    .section-base-content {
      display: flex;
      justify-content: space-between;
      width: 100%;
      gap: 12px;
    }

    .half-base {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      background: rgba(59, 130, 246, 0.04);
      border-radius: 0 0 6px 6px;
      padding: 4px 2px;
    }

    /* ── Pole details ── */
    .pole-details {
      margin-top: 6px;
      width: 100%;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.68rem;
      padding: 1px 4px;
    }

    .detail-lbl {
      color: #94a3b8;
    }
    .detail-val {
      color: #e2e8f0;
      font-weight: 500;
      font-family: 'Cascadia Code', 'Fira Code', monospace;
    }

    .detail-heading {
      font-size: 0.62rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: center;
      margin-top: 4px;
      padding-bottom: 2px;
      border-bottom: 1px solid rgba(100, 116, 139, 0.15);
    }

    .no-lines {
      font-size: 0.82rem;
      color: rgba(255,255,255,0.3);
      font-style: italic;
      padding: 12px 0;
      text-align: center;
    }
  `]
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

  /**
   * Dynamically build the CSS grid-template-columns string.
   *
   * Layout:  [line-label] [section]… [controls]
   *
   * Each section column includes half-poles on both sides.
   * For N poles there are N-1 section columns.
   */
  get gridTemplateColumns(): string {
    const n = this.canton?.sections?.length ?? 0;
    if (n === 0) return '1fr';
    let cols = '140px';                           // line-label column
    for (let i = 0; i < n; i++) {
      cols += ' minmax(160px, 1fr)';              // section column (includes half-poles)
    }
    cols += ' 140px';                             // controls column
    return cols;
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

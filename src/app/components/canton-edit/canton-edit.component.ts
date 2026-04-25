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
      <div class="modal-panel" role="dialog">

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

            <div class="canton-grid">

              <div class="left-panel">
                <div class="section-grid section-grid-header">
                    <div class="grid-cell section-header">
                      <span class="">xxxxxxxxxx</span>
                    </div>
                    <div class="grid-cell section-header">
                      <span class="">xxxxxxxxxx</span>
                    </div>                    
                </div>

                <ng-container *ngFor="let line of lines; let li = index">
                  <div class="grid-cell line-details line-row-cell">
                    <select
                      class="cg-line-select"
                      [ngModel]="line.type"
                      (ngModelChange)="onTypeChange(line, $event)">
                      <option *ngFor="let cable of cables" [value]="cable.type">{{ cable.type }}</option>
                    </select>
                    <input
                      type="number"
                      class="cg-max-input"
                      [ngModel]="line.maxConstraint"
                      (ngModelChange)="line.maxConstraint = $event"
                      min="0" step="0.1" />
                  </div>
                </ng-container>

                <div class="panel-spacer base-spacer"></div>
                <div class="panel-spacer details-spacer"></div>
              </div>

              <div class="sections-panel">

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

                          <div class="section-content" *ngIf="ls.linked">
                            <svg class="half-pole-svg" viewBox="6 0 6 44">
                              <rect x="4" y="0" width="4" height="44" fill="#555" rx="1"/>
                            </svg>
                            <div class="section-curve-wrapper">
                              <svg class="section-curve" viewBox="0 0 100 44" preserveAspectRatio="none">
                                <path d="M0,22 Q50,40 100,22" stroke="#63b3ed" stroke-width="2" fill="none"/>
                              </svg>
                              <span class="sag-label">S: {{ ls.sag | number:'1.2-2' }}</span>
                            </div>
                            <svg class="half-pole-svg" viewBox="0 0 6 44">
                              <rect x="4" y="0" width="4" height="44" fill="#555" rx="1"/>
                            </svg>
                          </div>

                          <div class="section-unlinked" *ngIf="!ls.linked">
                            <svg class="half-pole-svg" viewBox="6 0 6 44">
                              <rect x="4" y="0" width="4" height="44" fill="#555" rx="1"/>
                            </svg>
                            <svg class="section-dashed" viewBox="0 0 100 44" preserveAspectRatio="none">
                              <line x1="0" y1="22" x2="100" y2="22"
                                    stroke="#555" stroke-width="1" stroke-dasharray="6,4"/>
                            </svg>
                            <svg class="half-pole-svg" viewBox="0 0 6 44">
                              <rect x="4" y="0" width="4" height="44" fill="#555" rx="1"/>
                            </svg>
                          </div>

                        </ng-container>
                      </div>
                    </ng-container>
                  </div>
                </ng-container>

                <div class="section-grid section-grid-base">
                  <ng-container *ngFor="let section of canton.sections; let si = index">
                    <div class="grid-cell section-base">
                      <div class="base-combined">
                        <svg class="half-base-svg" width="22" height="56" viewBox="22 0 22 56">
                          <rect x="19" y="0" width="6" height="38" fill="#555" rx="1"/>
                          <rect x="12" y="38" width="20" height="4" fill="#57534e" rx="1"/>
                          <line x1="4" y1="46" x2="40" y2="46" stroke="#a8a29e" stroke-width="1.5" stroke-dasharray="4,2"/>
                          <line x1="24" y1="49" x2="30" y2="46" stroke="#a8a29e" stroke-width="0.8"/>
                          <line x1="32" y1="49" x2="38" y2="46" stroke="#a8a29e" stroke-width="0.8"/>
                        </svg>
                        <svg class="half-base-svg" width="22" height="56" viewBox="0 0 22 56">
                          <rect x="19" y="0" width="6" height="38" fill="#555" rx="1"/>
                          <rect x="12" y="38" width="20" height="4" fill="#57534e" rx="1"/>
                          <line x1="4" y1="46" x2="40" y2="46" stroke="#a8a29e" stroke-width="1.5" stroke-dasharray="4,2"/>
                          <line x1="8" y1="49" x2="14" y2="46" stroke="#a8a29e" stroke-width="0.8"/>
                          <line x1="16" y1="49" x2="22" y2="46" stroke="#a8a29e" stroke-width="0.8"/>
                        </svg>
                      </div>
                    </div>
                  </ng-container>
                </div>

                <div class="section-grid section-grid-details">
                  <ng-container *ngFor="let section of canton.sections; let si = index">
                    <div class="grid-cell section-details">
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
                  </ng-container>
                </div>
                
              </div>

              <div class="side-panel right-panel">
                <div class="panel-spacer header-spacer"></div>

                <ng-container *ngFor="let line of lines; let li = index">
                  <div class="grid-cell line-action line-row-cell">
                    <button class="btn-remove-line" (click)="removeLine(li)" title="Remove line">
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
          <button class="btn-secondary" (click)="cancel()">Close</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .modal-panel {
      max-width: 1024px;
      width: 100%;
      /* Optionally center the modal */
      margin-left: auto;
      margin-right: auto;
    }

    /* ── Grid wrapper (horizontal scroll for many poles) ── */
    .canton-grid-wrapper {
      padding: 4px 0;
      max-width: 100%;
    }

    .canton-grid {
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr) 40px;
      gap: 0;
      align-items: start;
      width: 100%;
      height: 100%;
    }

    .side-panel {
      display: flex;
      flex-direction: column;
    }

    .left-panel {
      display: flex;
      flex-direction: column;
    }

    .right-panel {
      overflow-x: hidden;
      width: 40px;
    }

    .sections-panel {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      overflow-x: auto;
      padding-bottom: 8px;
      scrollbar-gutter: stable;
    }

    .section-grid {
      display: flex;
      orientation: horizontal;
      gap: 0;
      align-items: stretch;
      width: max-content;
      min-width: 100%;
    }

    .panel-spacer,
    .line-row-cell,
    .section-cell {
      min-height: 44px;
    }

    .header-spacer,
    .section-grid-header .section-header {
      min-height: 38px;

    }

    .base-spacer,
    .section-grid-base .section-base {
      min-height: 56px;
    }

    .details-spacer,
    .section-grid-details .section-details {
      min-height: 138px;
    }

    /* ── Generic grid cell ── */
    .grid-cell {
      display: flex;
      align-items: center;
      justify-content: center;
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
      box-sizing: border-box;
      width: 160px;
    }

    .sh-pole {
      font-weight: 600;
      color: #93c5fd;
    }

    .sh-length {
      color: #a8a29e;
      font-size: 0.68rem;
    }

    /* ── Line details (left column) ── */
    .line-details {
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 6px 10px 6px 0;
      box-sizing: border-box;
    }

    .cg-line-select {
      flex: 1;
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

    .line-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .line-meta-label {
      font-size: 0.68rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* ── Section cell (half-poles + curve/dashed) ── */
    .section-cell {
      padding: 0;
      position: relative;
      box-sizing: border-box;
      width: 160px;
    }

    .section-content {
      display: flex;
      align-items: center;
      width: 100%;
      height: 44px;
      justify-content: center;
    }

    .half-pole-svg {
      width: 8px;
      height: 44px;
      flex-shrink: 0;
      display: block;
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
      line-height: 0;
    }

    .section-dashed {
      flex: 1;
      height: 36px;
    }

    /* ── Remove line action (right column) ── */
    .line-action {
      padding: 4px 0 4px 8px;
      justify-content: center;
      box-sizing: border-box;
    }

    .cg-max-input {
      flex: 0 0 74px;
      width: 74px;
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
    }

    .section-base {
      flex-direction: column;
      justify-content: center;
      padding: 0;
      min-height: 0;
      width: 160px;
    }

    .base-combined {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
      line-height: 0;
    }

    .half-base-svg {
      flex-shrink: 0;
      display: block;
    }

    /* ── Pole details & constraints row ── */
    .section-details {
      flex-direction: column;
      align-items: stretch;
      justify-content: center;
      padding: 6px 4px 8px;
      border-radius: 0 0 6px 6px;
      box-sizing: border-box;
      width: 160px;
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

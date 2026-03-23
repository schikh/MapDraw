/**
 * Canton Edit Modal Component
 * Displays a modal panel to view and edit canton details.
 */

import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Canton } from '../../model';

@Component({
  selector: 'app-canton-edit-modal',
  standalone: true,
  imports: [CommonModule],
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

          <div class="row-fields">
            <div class="field-group">
              <label class="field-label">Created</label>
              <div class="field-readonly">{{ canton.createdAt | date:'medium' }}</div>
            </div>
          </div>

          <hr class="divider">

          <!-- Stats -->
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-value">{{ canton.poles.length }}</div>
              <div class="stat-label">Poles</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ canton.sections.length }}</div>
              <div class="stat-label">Spans</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ totalLength | number:'1.0-0' }} m</div>
              <div class="stat-label">Total Length</div>
            </div>
          </div>

          <hr class="divider">

          <!-- Pole list -->
          <div class="field-label mb-2">Connected Poles</div>
          <div class="pole-list">
            <div
              class="pole-row"
              *ngFor="let pole of canton.poles; let i = index">
              <span class="pole-index">{{ i + 1 }}</span>
              <span class="pole-id">{{ pole.id }}</span>
              <span class="pole-meta">
                {{ pole.position.x | number:'1.4-4' }} ,
                {{ pole.position.y | number:'1.4-4' }}
              </span>
            </div>
          </div>

          <!-- Section lengths -->
          <div *ngIf="canton.sections.length > 0">
            <div class="field-label mt-3 mb-2">Span Lengths</div>
            <div class="section-list">
              <div class="section-row" *ngFor="let section of canton.sections; let i = index">
                <span class="section-label">Span {{ i + 1 }}</span>
                <span class="section-length">{{ section.length | number:'1.2-2' }} m</span>
              </div>
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
export class CantonEditModalComponent implements OnChanges {
  @Input() canton!: Canton;
  @Output() cancelled = new EventEmitter<void>();

  totalLength = 0;

  ngOnChanges(): void {
    if (this.canton) {
      this.totalLength = this.canton.sections.reduce((sum, s) => sum + s.length, 0);
    }
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

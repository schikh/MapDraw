/**
 * Sidebar Component
 * Collapsible left panel with drawing tool buttons.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MapService, DrawingMode } from '../services/map.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Sidebar Container -->
    <aside 
      class="sidebar d-flex flex-column bg-body border-end border-secondary"
      [class.collapsed]="isCollapsed">
      
      <!-- Toggle Button -->
      <button 
        class="btn btn-sm toggle-btn"
        (click)="toggleCollapse()"
        [title]="isCollapsed ? 'Expand panel' : 'Collapse panel'">
        <i class="bi" [class.bi-chevron-right]="isCollapsed" [class.bi-chevron-left]="!isCollapsed"></i>
      </button>

      <!-- Sidebar Content -->
      <div class="sidebar-content d-flex flex-column" *ngIf="!isCollapsed">
        <!-- Header -->
        <div class="sidebar-header p-3 border-bottom border-secondary">
          <h6 class="mb-0 text-light">
            <i class="bi bi-tools me-2"></i>
            Drawing Tools
          </h6>
        </div>

        <!-- Drawing Tools Section -->
        <div class="p-3">
          <!-- Tool Buttons -->
          <button *ngFor="let tool of tools"
            class="btn w-100 mb-2 d-flex align-items-center"
            [ngClass]="currentMode === tool.mode ? tool.activeClass : 'btn-outline-light'"
            (click)="setMode(tool.mode)"
            [title]="tool.title">
            <i class="bi me-2" [ngClass]="tool.icon"></i>
            <span>{{ tool.label }}</span>
          </button>

          <!-- Stop Drawing Button -->
          <button 
            class="btn btn-outline-warning w-100 mb-3 d-flex align-items-center"
            (click)="stopDrawing()"
            [disabled]="currentMode === 'none'"
            title="Stop current drawing operation">
            <i class="bi bi-x-circle me-2"></i>
            <span>Stop Drawing</span>
          </button>

          <!-- Divider -->
          <hr class="border-secondary my-3">

          <!-- Statistics Section -->
          <div class="stats-section">
            <h6 class="text-muted small mb-2">
              <i class="bi bi-bar-chart me-1"></i>
              Statistics
            </h6>
            <div class="stat-item d-flex justify-content-between mb-1">
              <span class="text-light small">Poles:</span>
              <span class="badge bg-primary">{{ stats.poles }}</span>
            </div>
            <div class="stat-item d-flex justify-content-between mb-3">
              <span class="text-light small">Cantons:</span>
              <span class="badge bg-success">{{ stats.cantons }}</span>
            </div>
          </div>

          <!-- Clear Data Button -->
          <button 
            class="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center"
            (click)="confirmClear()"
            [disabled]="stats.poles === 0 && stats.cantons === 0"
            title="Clear all poles and cantons">
            <i class="bi bi-trash me-2"></i>
            <span>Clear All Data</span>
          </button>
        </div>

        <!-- Mode Indicator -->
        <div class="mode-indicator p-3 border-top border-secondary mt-auto">
          <small class="text-body-secondary d-block mb-1">Current Mode:</small>
          <span class="badge w-100 py-2" [ngClass]="getModeClass()">
            <i class="bi me-1" [ngClass]="getModeIcon()"></i>
            {{ getModeLabel() }}
          </span>
        </div>
      </div>

      <!-- Collapsed View -->
      <div class="collapsed-icons d-flex flex-column align-items-center p-2" *ngIf="isCollapsed">
        <button *ngFor="let tool of tools"
          class="btn btn-sm mb-2"
          [ngClass]="currentMode === tool.mode ? tool.activeClass : 'btn-outline-light'"
          (click)="setMode(tool.mode)"
          [title]="tool.label">
          <i class="bi" [ngClass]="tool.icon"></i>
        </button>
        <button 
          class="btn btn-outline-warning btn-sm mb-2"
          (click)="stopDrawing()"
          [disabled]="currentMode === 'none'"
          title="Stop Drawing">
          <i class="bi bi-x-circle"></i>
        </button>
      </div>
    </aside>

    <!-- Confirmation Modal -->
    <div 
      class="modal fade" 
      [class.show]="showConfirmModal" 
      [style.display]="showConfirmModal ? 'block' : 'none'"
      tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content border-danger">
          <div class="modal-header border-secondary">
            <h6 class="modal-title text-danger">
              <i class="bi bi-exclamation-triangle me-2"></i>
              Confirm Delete
            </h6>
            <button 
              type="button" 
              class="btn-close btn-close-white" 
              (click)="cancelClear()"
              aria-label="Close">
            </button>
          </div>
          <div class="modal-body">
            <p class="mb-0 small">
              Are you sure you want to delete all poles and cantons? This action cannot be undone.
            </p>
          </div>
          <div class="modal-footer border-secondary">
            <button type="button" class="btn btn-secondary btn-sm" (click)="cancelClear()">
              Cancel
            </button>
            <button type="button" class="btn btn-danger btn-sm" (click)="executeClear()">
              <i class="bi bi-trash me-1"></i>
              Delete All
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="showConfirmModal" (click)="cancelClear()"></div>
  `,
  styles: []
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  currentMode: DrawingMode = 'none';
  showConfirmModal = false;
  stats = { poles: 0, cantons: 0 };

  /** Tool definitions for sidebar buttons */
  readonly tools: { mode: DrawingMode; icon: string; label: string; activeClass: string; title: string }[] = [
    { mode: 'pole', icon: 'bi-geo-alt-fill', label: 'Add Pole', activeClass: 'btn-primary', title: 'Click to add poles to the map' },
    { mode: 'canton', icon: 'bi-bezier2', label: 'Add Canton', activeClass: 'btn-success', title: 'Click poles to create a canton line' },
    { mode: 'rotate', icon: 'bi-arrow-repeat', label: 'Rotate Pole', activeClass: 'btn-warning', title: 'Click a pole, then drag to rotate' },
    { mode: 'move', icon: 'bi-arrows-move', label: 'Move Pole', activeClass: 'btn-info', title: 'Click a pole, then drag to move it' },
    { mode: 'remove-canton', icon: 'bi-scissors', label: 'Remove Canton', activeClass: 'btn-danger', title: 'Click a canton, then click again to delete' },
    { mode: 'remove-pole', icon: 'bi-geo-alt', label: 'Remove Pole', activeClass: 'btn-danger', title: 'Click a pole, then click again to delete' },
  ];

  private modeSubscription?: Subscription;
  private statsSubscription?: Subscription;

  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    // Subscribe to mode changes
    this.modeSubscription = this.mapService.mode$.subscribe(mode => {
      this.currentMode = mode;
    });
    
    // Subscribe to stats changes
    this.statsSubscription = this.mapService.stats$.subscribe(stats => {
      this.stats = stats;
    });
    
    // Initial stats update
    this.stats = this.mapService.getStats();
  }

  ngOnDestroy(): void {
    this.modeSubscription?.unsubscribe();
    this.statsSubscription?.unsubscribe();
  }

  /**
   * Toggles the sidebar collapsed state.
   */
  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  /**
   * Sets the current drawing mode.
   */
  setMode(mode: DrawingMode): void {
    this.mapService.setMode(mode);
  }

  /**
   * Stops the current drawing operation.
   */
  stopDrawing(): void {
    this.mapService.finishDrawing();
  }

  /**
   * Returns a human-readable label for the current mode.
   */
  getModeLabel(): string {
    const tool = this.tools.find(t => t.mode === this.currentMode);
    return tool ? tool.label : 'Select Tool';
  }

  /** Returns the Bootstrap badge class for the current mode. */
  getModeClass(): string {
    const tool = this.tools.find(t => t.mode === this.currentMode);
    if (!tool) return 'bg-secondary';
    const cls = tool.activeClass.replace('btn-', 'bg-');
    return (this.currentMode === 'rotate' || this.currentMode === 'move') ? cls + ' text-dark' : cls;
  }

  /** Returns the Bootstrap icon class for the current mode. */
  getModeIcon(): string {
    const tool = this.tools.find(t => t.mode === this.currentMode);
    return tool ? tool.icon : 'bi-cursor';
  }

  /**
   * Shows the confirmation modal for clearing data.
   */
  confirmClear(): void {
    this.showConfirmModal = true;
  }

  /**
   * Cancels the clear operation.
   */
  cancelClear(): void {
    this.showConfirmModal = false;
  }

  /**
   * Executes the clear all data operation.
   */
  executeClear(): void {
    this.mapService.clearAllData();
    this.showConfirmModal = false;
  }
}

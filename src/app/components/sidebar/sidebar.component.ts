/**
 * Sidebar Component
 * Collapsible left panel with drawing tool buttons.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MapService, DrawingMode } from '../../services/map.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Sidebar Container -->
    <aside 
      class="sidebar bg-dark border-end border-secondary"
      [class.collapsed]="isCollapsed">
      
      <!-- Toggle Button -->
      <button 
        class="btn btn-sm toggle-btn"
        (click)="toggleCollapse()"
        [title]="isCollapsed ? 'Expand panel' : 'Collapse panel'">
        <i class="bi" [class.bi-chevron-right]="isCollapsed" [class.bi-chevron-left]="!isCollapsed"></i>
      </button>

      <!-- Sidebar Content -->
      <div class="sidebar-content" *ngIf="!isCollapsed">
        <!-- Header -->
        <div class="sidebar-header p-3 border-bottom border-secondary">
          <h6 class="mb-0 text-light">
            <i class="bi bi-tools me-2"></i>
            Drawing Tools
          </h6>
        </div>

        <!-- Drawing Tools Section -->
        <div class="p-3">
          <!-- Add Pole Button -->
          <button 
            class="btn w-100 mb-2 d-flex align-items-center"
            [class.btn-primary]="currentMode === 'pole'"
            [class.btn-outline-light]="currentMode !== 'pole'"
            (click)="setMode('pole')"
            title="Click to add poles to the map">
            <i class="bi bi-geo-alt-fill me-2"></i>
            <span>Add Pole</span>
          </button>

          <!-- Add Canton Button -->
          <button 
            class="btn w-100 mb-2 d-flex align-items-center"
            [class.btn-success]="currentMode === 'canton'"
            [class.btn-outline-light]="currentMode !== 'canton'"
            (click)="setMode('canton')"
            title="Click poles to create a canton line">
            <i class="bi bi-bezier2 me-2"></i>
            <span>Add Canton</span>
          </button>

          <!-- Rotate Pole Button -->
          <button 
            class="btn w-100 mb-2 d-flex align-items-center"
            [class.btn-warning]="currentMode === 'rotate'"
            [class.btn-outline-light]="currentMode !== 'rotate'"
            (click)="setMode('rotate')"
            title="Click a pole to select it, then drag to rotate">
            <i class="bi bi-arrow-repeat me-2"></i>
            <span>Rotate Pole</span>
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
          <small class="text-muted d-block mb-1">Current Mode:</small>
          <span 
            class="badge w-100 py-2"
            [class.bg-secondary]="currentMode === 'none'"
            [class.bg-primary]="currentMode === 'pole'"
            [class.bg-success]="currentMode === 'canton'"
            [class.bg-warning]="currentMode === 'rotate'"
            [class.text-dark]="currentMode === 'rotate'">
            <i class="bi me-1"
               [class.bi-cursor]="currentMode === 'none'"
               [class.bi-geo-alt-fill]="currentMode === 'pole'"
               [class.bi-bezier2]="currentMode === 'canton'"
               [class.bi-arrow-repeat]="currentMode === 'rotate'">
            </i>
            {{ getModeLabel() }}
          </span>
        </div>
      </div>

      <!-- Collapsed View -->
      <div class="collapsed-icons p-2" *ngIf="isCollapsed">
        <button 
          class="btn btn-sm mb-2"
          [class.btn-primary]="currentMode === 'pole'"
          [class.btn-outline-light]="currentMode !== 'pole'"
          (click)="setMode('pole')"
          title="Add Pole">
          <i class="bi bi-geo-alt-fill"></i>
        </button>
        <button 
          class="btn btn-sm mb-2"
          [class.btn-success]="currentMode === 'canton'"
          [class.btn-outline-light]="currentMode !== 'canton'"
          (click)="setMode('canton')"
          title="Add Canton">
          <i class="bi bi-bezier2"></i>
        </button>
        <button 
          class="btn btn-sm mb-2"
          [class.btn-warning]="currentMode === 'rotate'"
          [class.btn-outline-light]="currentMode !== 'rotate'"
          (click)="setMode('rotate')"
          title="Rotate Pole">
          <i class="bi bi-arrow-repeat"></i>
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
        <div class="modal-content bg-dark text-light border-danger">
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
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .sidebar {
      width: 250px;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      transition: width 0.3s ease;
      background: var(--app-bg-dark, #1a1a2e);
      border-right: 1px solid var(--app-border-color, rgba(255, 255, 255, 0.1));
    }

    .sidebar.collapsed {
      width: 50px;
    }

    .sidebar-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
    }

    .toggle-btn {
      position: absolute;
      right: -12px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 10;
      background: var(--app-bg-dark, #1a1a2e);
      border: 1px solid var(--app-border-color, rgba(255, 255, 255, 0.1));
      color: var(--app-text-primary, #eaeaea);
      border-radius: 50%;
      width: 24px;
      height: 24px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .toggle-btn:hover {
      background: var(--app-accent-primary, #0d6efd);
      border-color: var(--app-accent-primary, #0d6efd);
    }

    .collapsed-icons {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 1rem;
    }

    .collapsed-icons .btn {
      width: 36px;
      height: 36px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .mode-indicator {
      background: rgba(0, 0, 0, 0.2);
    }

    /* Responsive Styles */
    @media (max-width: 768px) {
      .sidebar {
        position: absolute;
        z-index: 1000;
        height: auto;
        max-height: calc(100% - 20px);
        margin: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .sidebar.collapsed {
        width: 50px;
        height: auto;
      }

      .toggle-btn {
        right: -10px;
      }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  currentMode: DrawingMode = 'none';
  showConfirmModal = false;
  stats = { poles: 0, cantons: 0 };
  
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
    switch (this.currentMode) {
      case 'pole': return 'Adding Poles';
      case 'canton': return 'Drawing Canton';
      case 'rotate': return 'Rotating Pole';
      default: return 'Select Tool';
    }
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

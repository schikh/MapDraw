/**
 * Header Component
 * Static navigation header with dark theme styling.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Navigation Header -->
    <nav class="navbar navbar-expand-lg bg-body border-bottom border-secondary">
      <div class="container-fluid">
        <!-- Brand Logo -->
        <a class="navbar-brand d-flex align-items-center" href="#">
          <i class="bi bi-map-fill text-primary me-2"></i>
          <span class="fw-bold">MapDraw</span>
        </a>

        <!-- Mobile Toggle Button -->
        <button 
          class="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          aria-controls="navbarNav" 
          aria-expanded="false" 
          aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Navigation Items -->
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <button 
                class="btn btn-outline-light btn-sm"
                (click)="showAbout()"
                title="About this application">
                <i class="bi bi-info-circle me-1"></i>
                About
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- About Modal -->
    <div 
      class="modal fade" 
      [class.show]="isAboutVisible" 
      [style.display]="isAboutVisible ? 'block' : 'none'"
      tabindex="-1"
      (click)="hideAbout()">
      <div class="modal-dialog modal-dialog-centered" (click)="$event.stopPropagation()">
          <div class="modal-content border-secondary">
          <div class="modal-header border-secondary">
            <h5 class="modal-title">
              <i class="bi bi-info-circle text-primary me-2"></i>
              About MapDraw
            </h5>
            <button 
              type="button" 
              class="btn-close btn-close-white" 
              (click)="hideAbout()"
              aria-label="Close">
            </button>
          </div>
          <div class="modal-body">
            <p>
              <strong>MapDraw</strong> is a mapping application for creating poles and cantons
              on an OpenStreetMap-based map. Coordinates are displayed in Lambert 72 (EPSG:31370).
            </p>
            <h6 class="mt-3">Features:</h6>
            <ul class="small">
              <li>Add poles to the map (minimum 50cm apart)</li>
              <li>Rotate poles to any angle with visual lever</li>
              <li>Create cantons by connecting poles</li>
              <li>Lambert 72 (Belgian) coordinate display</li>
              <li>Data persisted in browser localStorage</li>
              <li>Works fully offline</li>
            </ul>
            <h6 class="mt-3">How to Use:</h6>
            <ol class="small">
              <li>Click "Add Pole" to place poles on the map</li>
              <li>Click "Rotate Pole" then click a pole to select it, drag the red handle to rotate</li>
              <li>Click "Add Canton" then click poles to connect them</li>
              <li>Double-click or change tool to finish drawing</li>
            </ol>
          </div>
          <div class="modal-footer border-secondary">
            <button type="button" class="btn btn-secondary btn-sm" (click)="hideAbout()">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" *ngIf="isAboutVisible" (click)="hideAbout()"></div>
  `,
  styles: []
})
export class HeaderComponent {
  isAboutVisible = false;

  /**
   * Shows the about modal dialog.
   */
  showAbout(): void {
    this.isAboutVisible = true;
  }

  /**
   * Hides the about modal dialog.
   */
  hideAbout(): void {
    this.isAboutVisible = false;
  }
}

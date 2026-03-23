/**
 * Map Component
 * Main map display using OpenLayers with coordinates and scale display.
 */

import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MapService } from '../../services/map.service';
import { PoleEditModalComponent } from '../pole-edit-modal/pole-edit-modal.component';
import { CantonEditModalComponent } from '../canton-edit-modal/canton-edit-modal.component';
import { Pole, Canton } from '../../model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, PoleEditModalComponent, CantonEditModalComponent],
  template: `
    <!-- Map Container -->
    <div class="map-wrapper">
      <!-- OpenLayers Map Target -->
      <div #mapContainer class="map-container"></div>

      <!-- Coordinates Display (Bottom Right) -->
      <div class="coordinates-display">
        <i class="bi bi-crosshair me-1"></i>
        <span>{{ cursorCoordinates || 'Move cursor over map' }}</span>
      </div>

      <!-- Message Toast -->
      <div 
        class="message-toast"
        *ngIf="message"
        [class.toast-success]="message.type === 'success'"
        [class.toast-error]="message.type === 'error'"
        [class.toast-info]="message.type === 'info'">
        <i class="bi me-2"
           [class.bi-check-circle-fill]="message.type === 'success'"
           [class.bi-exclamation-triangle-fill]="message.type === 'error'"
           [class.bi-info-circle-fill]="message.type === 'info'">
        </i>
        <span>{{ message.text }}</span>
        <button class="btn-close btn-close-white ms-2" (click)="dismissMessage()"></button>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading map...</span>
        </div>
        <p class="mt-2 text-light">Loading map...</p>
      </div>

      <!-- Pole Edit Modal -->
      <app-pole-edit-modal
        *ngIf="editingPole"
        [pole]="editingPole"
        (saved)="onPoleSaved($event)"
        (cancelled)="closePoleModal()">
      </app-pole-edit-modal>

      <!-- Canton Edit Modal -->
      <app-canton-edit-modal
        *ngIf="editingCanton"
        [canton]="editingCanton"
        (cancelled)="closeCantonModal()">
      </app-canton-edit-modal>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      width: 100%;
    }

    .map-wrapper {
      position: relative;
      height: 100%;
      width: 100%;
      background: var(--app-bg-dark, #1a1a2e);
    }

    .map-container {
      width: 100%;
      height: 100%;
    }

    /* Coordinates Display */
    .coordinates-display {
      position: absolute;
      bottom: 30px;
      right: 10px;
      background: rgba(0, 0, 0, 0.75);
      color: #fff;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-family: monospace;
      z-index: 100;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Message Toast */
    .message-toast {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 16px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      z-index: 1000;
      font-size: 0.875rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: slideDown 0.3s ease;
      max-width: 90%;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }

    .toast-success {
      background: rgba(25, 135, 84, 0.95);
      color: #fff;
    }

    .toast-error {
      background: rgba(220, 53, 69, 0.95);
      color: #fff;
    }

    .toast-info {
      background: rgba(13, 110, 253, 0.95);
      color: #fff;
    }

    .message-toast .btn-close {
      font-size: 0.65rem;
      padding: 0;
      opacity: 0.8;
    }

    /* Loading Overlay */
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(26, 26, 46, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    /* OpenLayers Custom Styles */
    :host ::ng-deep .ol-scale-line {
      position: absolute;
      bottom: 30px;
      left: 10px;
      background: rgba(0, 0, 0, 0.75);
      border-radius: 4px;
      padding: 2px;
    }

    :host ::ng-deep .ol-scale-line-inner {
      border: 1px solid #fff;
      border-top: none;
      color: #fff;
      font-size: 10px;
      text-align: center;
      margin: 1px;
    }

    :host ::ng-deep .ol-attribution {
      position: absolute;
      right: 10px;
      bottom: 60px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 10px;
    }

    :host ::ng-deep .ol-attribution a {
      color: #6ea8fe;
    }

    :host ::ng-deep .ol-zoom {
      position: absolute;
      top: 10px;
      right: 10px;
      background: transparent;
    }

    :host ::ng-deep .ol-zoom button {
      background: rgba(0, 0, 0, 0.75);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      width: 32px;
      height: 32px;
      margin: 2px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 18px;
    }

    :host ::ng-deep .ol-zoom button:hover {
      background: rgba(13, 110, 253, 0.8);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .coordinates-display {
        bottom: 35px;
        right: 5px;
        font-size: 0.7rem;
        padding: 4px 8px;
      }

      .message-toast {
        font-size: 0.8rem;
        padding: 8px 12px;
      }
    }
  `]
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  cursorCoordinates = '';
  message: { type: 'success' | 'error' | 'info'; text: string } | null = null;
  isLoading = true;

  editingPole: Pole | null = null;
  editingCanton: Canton | null = null;

  private coordsSubscription?: Subscription;
  private messageSubscription?: Subscription;
  private editPoleSubscription?: Subscription;
  private editCantonSubscription?: Subscription;

  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    this.coordsSubscription = this.mapService.cursorCoords$.subscribe(coords => {
      this.cursorCoordinates = coords;
    });
    this.messageSubscription = this.mapService.message$.subscribe(msg => {
      this.message = msg;
    });
    this.editPoleSubscription = this.mapService.editPole$.subscribe(pole => {
      this.editingCanton = null;
      this.editingPole = pole;
    });
    this.editCantonSubscription = this.mapService.editCanton$.subscribe(canton => {
      this.editingPole = null;
      this.editingCanton = canton;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.mapService.initializeMap(this.mapContainer.nativeElement);
      this.isLoading = false;
    }, 100);
  }

  ngOnDestroy(): void {
    this.coordsSubscription?.unsubscribe();
    this.messageSubscription?.unsubscribe();
    this.editPoleSubscription?.unsubscribe();
    this.editCantonSubscription?.unsubscribe();
  }

  onPoleSaved(updated: Pole): void {
    this.mapService.updatePole(updated);
    this.editingPole = null;
  }

  closePoleModal(): void {
    this.editingPole = null;
  }

  closeCantonModal(): void {
    this.editingCanton = null;
  }

  dismissMessage(): void {
    this.message = null;
  }
}

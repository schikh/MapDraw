/**
 * Map Component
 * Main map display using OpenLayers with coordinates and scale display.
 */

import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MapService } from '../../services/map.service';
import { PoleEditComponent } from '../pole-edit/pole-edit.component';
import { CantonEditComponent } from '../canton-edit/canton-edit.component';
import { Canton } from '../../model/Canton';
import { Pole } from '../../model/Pole';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, PoleEditComponent, CantonEditComponent],
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

      <!-- Loading Overlay -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading map...</span>
        </div>
        <p class="mt-2 text-light">Loading map...</p>
      </div>

      <!-- Pole Edit Modal -->
      <app-pole-edit
        *ngIf="editingPole"
        [pole]="editingPole"
        (saved)="onPoleSaved($event)"
        (cancelled)="closePoleModal()">
      </app-pole-edit>

      <!-- Canton Edit Modal -->
      <app-canton-edit
        *ngIf="editingCanton"
        [canton]="editingCanton"
        (cancelled)="closeCantonModal()">
      </app-canton-edit>

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
    }
  `]
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  cursorCoordinates = '';
  isLoading = true;

  editingPole: Pole | null = null;
  editingCanton: Canton | null = null;

  private coordsSubscription?: Subscription;
  private editPoleSubscription?: Subscription;
  private editCantonSubscription?: Subscription;

  constructor(private mapService: MapService) {}

  ngOnInit(): void {
    this.coordsSubscription = this.mapService.cursorCoords$.subscribe(coords => {
      this.cursorCoordinates = coords;
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

}

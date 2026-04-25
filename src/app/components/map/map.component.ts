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
    <div class="map-wrapper position-relative h-100 w-100">
      <!-- OpenLayers Map Target -->
      <div #mapContainer class="map-container h-100 w-100"></div>

      <!-- Coordinates Display (Bottom Right) -->
      <div class="coordinates-display position-absolute end-0 bottom-0 mb-4 me-2 px-3 py-2 rounded small text-white font-monospace d-flex align-items-center gap-1">
        <i class="bi bi-crosshair me-1"></i>
        <span>{{ cursorCoordinates || 'Move cursor over map' }}</span>
      </div>

      <!-- Loading Overlay -->
      <div class="loading-overlay position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center" *ngIf="isLoading">
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
  styles: []
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

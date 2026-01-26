/**
 * Map Service
 * Handles OpenLayers map initialization, drawing tools, and data persistence.
 * Manages poles and cantons (polylines connecting poles).
 * Supports Lambert 72 (EPSG:31370) coordinate display.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { Style, Fill, Stroke, Icon } from 'ol/style';
import ScaleLine from 'ol/control/ScaleLine';
import { DragPan } from 'ol/interaction';
import { MapBrowserEvent } from 'ol';
import proj4 from 'proj4';
import { Canton, Pole, Project } from '../model/model';

// ============================================================
// LAMBERT 72 PROJECTION (EPSG:31370)
// ============================================================

const LAMBERT_72_PROJ = '+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=-106.8686,52.2978,-103.7239,0.3366,-0.457,1.8422,-1.2747 +units=m +no_defs';

// Register Lambert 72 projection with proj4
proj4.defs('EPSG:31370', LAMBERT_72_PROJ);

/** Drawing mode enumeration */
export type DrawingMode = 'none' | 'pole' | 'canton' | 'rotate';

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_KEY = 'map-drawing-app-state';
const MIN_POLE_DISTANCE_METERS = 0.5; // 50cm minimum distance between poles
const DEFAULT_CENTER: [number, number] = [4.3517, 50.8503]; // Brussels, Belgium
const DEFAULT_ZOOM = 18;

@Injectable({
  providedIn: 'root'
})
export class MapService {
  // ============================================================
  // PROPERTIES
  // ============================================================

  private map!: Map;
  private poleSource!: VectorSource;
  private cantonSource!: VectorSource;
  private tempLineSource!: VectorSource;
  private leverSource!: VectorSource;
  
  // Data storage
  private poles: Pole[] = [];
  private cantons: Canton[] = [];
  
  // Drawing state
  private currentMode: DrawingMode = 'none';
  private cantonPoleIds: string[] = []; // Poles being added to current canton
  private lastMousePosition: [number, number] | null = null;
  
  // Rotation state
  private selectedPoleId: string | null = null;
  private isRotating = false;
  private dragPanInteraction: DragPan | null = null;
  
  // Observables for component communication
  private modeSubject = new BehaviorSubject<DrawingMode>('none');
  private messageSubject = new BehaviorSubject<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  private cursorCoordsSubject = new BehaviorSubject<string>('');
  private statsSubject = new BehaviorSubject<{ poles: number; cantons: number }>({ poles: 0, cantons: 0 });
  
  mode$ = this.modeSubject.asObservable();
  message$ = this.messageSubject.asObservable();
  cursorCoords$ = this.cursorCoordsSubject.asObservable();
  stats$ = this.statsSubject.asObservable();

  // ============================================================
  // MAP INITIALIZATION
  // ============================================================

  /**
   * Initializes the OpenLayers map with all layers and controls.
   * @param targetElement - The DOM element to render the map in
   */
  initializeMap(targetElement: HTMLElement): void {
    // Load persisted data
    this.loadState();

    // Create vector sources for different feature types
    this.poleSource = new VectorSource();
    this.cantonSource = new VectorSource();
    this.tempLineSource = new VectorSource();
    this.leverSource = new VectorSource();

    // Create the map with OSM base layer and vector layers
    this.map = new Map({
      target: targetElement,
      layers: [
        // Base map layer (OpenStreetMap)
        new TileLayer({
          source: new OSM()
        }),
        // Canton polylines layer
        new VectorLayer({
          source: this.cantonSource,
          style: this.getCantonStyle()
        }),
        // Temporary drawing line layer
        new VectorLayer({
          source: this.tempLineSource,
          style: this.getTempLineStyle()
        }),
        // Poles layer
        new VectorLayer({
          source: this.poleSource,
          style: (feature) => this.getPoleStyle(feature as Feature)
        }),
        // Rotation lever layer (on top)
        new VectorLayer({
          source: this.leverSource,
          style: this.getLeverStyle()
        })
      ],
      view: new View({
        center: fromLonLat(DEFAULT_CENTER),
        zoom: DEFAULT_ZOOM
      })
    });

    // Get reference to DragPan interaction for disabling during rotation
    this.map.getInteractions().forEach((interaction) => {
      if (interaction instanceof DragPan) {
        this.dragPanInteraction = interaction;
      }
    });

    // Add scale line control (bottom left)
    const scaleLine = new ScaleLine({
      units: 'metric',
      className: 'ol-scale-line custom-scale'
    });
    this.map.addControl(scaleLine);

    // Set up event listeners
    this.setupEventListeners();

    // Render existing features from storage
    this.renderAllFeatures();

    // Update stats
    this.updateStats();

    // Show initial info message
    this.showMessage('info', 'Ready. Select a drawing tool to begin.');
  }

  // ============================================================
  // EVENT HANDLERS
  // ============================================================

  /**
   * Sets up all map event listeners for drawing and interaction.
   */
  private setupEventListeners(): void {
    // Track mouse position for coordinates display and temp line
    this.map.on('pointermove', (event) => {
      // Convert map coordinates to WGS84 (lon/lat)
      const lonLat = toLonLat(event.coordinate);
      
      // Transform WGS84 to Lambert 72 (EPSG:31370)
      const lambert72 = proj4('EPSG:4326', 'EPSG:31370', lonLat);
      
      // Display Lambert 72 coordinates
      this.cursorCoordsSubject.next(
        `Lambert 72: X=${lambert72[0].toFixed(2)} m, Y=${lambert72[1].toFixed(2)} m`
      );
      
      // Update temporary line during canton drawing
      if (this.currentMode === 'canton' && this.cantonPoleIds.length > 0) {
        this.lastMousePosition = event.coordinate as [number, number];
        this.updateTempLine();
      }
      
      // Handle rotation drag
      if (this.isRotating && this.selectedPoleId) {
        this.handleRotationDrag(event.coordinate as [number, number]);
      }
    });

    // Handle map clicks based on current mode
    this.map.on('click', (event) => {
      this.handleMapClick(event.coordinate as [number, number]);
    });

    // Handle double-click to finish drawing
    this.map.on('dblclick', (event) => {
      event.preventDefault();
      this.handleDoubleClick(event.coordinate as [number, number]);
    });

    // Handle drag for rotation - use pointerdrag event
    // @ts-ignore - pointerdrag is a valid OpenLayers event
    this.map.on('pointerdrag', (event: MapBrowserEvent<PointerEvent>) => {
      if (this.currentMode === 'rotate' && this.selectedPoleId) {
        // Check if dragging near the lever handle
        const leverFeature = this.leverSource.getFeatures()[0];
        if (leverFeature) {
          const leverCoord = (leverFeature.getGeometry() as Point).getCoordinates();
          const distance = Math.sqrt(
            Math.pow(event.coordinate[0] - leverCoord[0], 2) +
            Math.pow(event.coordinate[1] - leverCoord[1], 2)
          );
          const tolerance = this.map.getView().getResolution()! * 20;
          if (distance < tolerance || this.isRotating) {
            this.isRotating = true;
            // Disable map panning while rotating
            if (this.dragPanInteraction) {
              this.dragPanInteraction.setActive(false);
            }
            this.handleRotationDrag(event.coordinate as [number, number]);
            event.preventDefault();
          }
        }
      }
    });

    // Handle mouse up to finish rotation - use moveend as fallback
    const viewport = this.map.getViewport();
    viewport.addEventListener('pointerup', () => {
      if (this.isRotating) {
        this.isRotating = false;
        // Re-enable map panning
        if (this.dragPanInteraction) {
          this.dragPanInteraction.setActive(true);
        }
        this.saveState();
        this.showMessage('success', 'Pole rotation updated.');
      }
    });

    // Change cursor based on mode
    this.map.getTargetElement().style.cursor = 'default';
  }

  /**
   * Handles single click on the map based on current drawing mode.
   */
  private handleMapClick(coordinate: [number, number]): void {
    switch (this.currentMode) {
      case 'pole':
        this.addPole(coordinate);
        break;
      case 'canton':
        this.handleCantonClick(coordinate);
        break;
      case 'rotate':
        this.handleRotateClick(coordinate);
        break;
    }
  }

  /**
   * Handles click in rotate mode - selects a pole to rotate.
   */
  private handleRotateClick(coordinate: [number, number]): void {
    const pole = this.findPoleAtCoordinate(coordinate);
    
    if (pole) {
      // Select this pole for rotation
      this.selectedPoleId = pole.id;
      this.updateLever();
      this.poleSource.changed(); // Refresh pole styles
      this.showMessage('info', 'Pole selected. Drag the red handle to rotate.');
    } else {
      // Deselect if clicking elsewhere
      if (this.selectedPoleId) {
        this.selectedPoleId = null;
        this.leverSource.clear();
        this.poleSource.changed();
        this.showMessage('info', 'Click on a pole to select it for rotation.');
      }
    }
  }

  /**
   * Handles dragging to rotate the selected pole.
   */
  private handleRotationDrag(coordinate: [number, number]): void {
    const pole = this.poles.find(p => p.id === this.selectedPoleId);
    if (!pole) return;
    
    const poleCoord = fromLonLat(pole.coordinates);
    
    // Calculate angle from pole center to mouse position
    const dx = coordinate[0] - poleCoord[0];
    const dy = coordinate[1] - poleCoord[1];
    
    // Calculate angle in degrees (0 = north, clockwise positive)
    let angle = Math.atan2(dx, dy) * (180 / Math.PI);
    
    // Normalize to 0-360 range
    if (angle < 0) angle += 360;
    
    // Update pole rotation
    pole.rotation = Math.round(angle);
    
    // Update displays
    this.updateLever();
    this.poleSource.changed();
  }

  /**
   * Updates the rotation lever position for the selected pole.
   */
  private updateLever(): void {
    this.leverSource.clear();
    
    if (!this.selectedPoleId) return;
    
    const pole = this.poles.find(p => p.id === this.selectedPoleId);
    if (!pole) return;
    
    const poleCoord = fromLonLat(pole.coordinates);
    const rotation = pole.rotation || 0;
    
    // Calculate lever position (40 pixels from pole center in direction of rotation)
    const leverDistance = this.map.getView().getResolution()! * 40;
    const angleRad = rotation * (Math.PI / 180);
    const leverX = poleCoord[0] + leverDistance * Math.sin(angleRad);
    const leverY = poleCoord[1] + leverDistance * Math.cos(angleRad);
    
    const leverFeature = new Feature({
      geometry: new Point([leverX, leverY])
    });
    this.leverSource.addFeature(leverFeature);
  }

  /**
   * Handles double-click to finish pole addition or canton drawing.
   */
  private handleDoubleClick(coordinate: [number, number]): void {
    if (this.currentMode === 'pole') {
      // Check if clicking on an existing pole
      const clickedPole = this.findPoleAtCoordinate(coordinate);
      if (clickedPole) {
        this.finishDrawing();
        this.showMessage('success', 'Pole drawing completed.');
      } else {
        // Double-click not on a pole - finish without adding last segment
        this.finishDrawing();
        this.showMessage('info', 'Pole drawing stopped.');
      }
    } else if (this.currentMode === 'canton') {
      this.finishCantonDrawing();
    }
  }

  // ============================================================
  // POLE MANAGEMENT
  // ============================================================

  /**
   * Adds a new pole at the specified coordinate.
   * Validates minimum distance from existing poles.
   */
  private addPole(coordinate: [number, number]): void {
    // Check minimum distance from existing poles
    const tooClose = this.poles.some(pole => {
      const poleCoord = fromLonLat(pole.coordinates);
      const distance = this.calculateDistance(coordinate, poleCoord as [number, number]);
      return distance < MIN_POLE_DISTANCE_METERS;
    });

    if (tooClose) {
      this.showMessage('error', 'Cannot place pole within 50cm of another pole.');
      return;
    }

    // Create new pole with rotation angle
    const lonLat = toLonLat(coordinate) as [number, number];
    const pole: Pole = {
      id: this.generateId(),
      coordinates: lonLat,
      rotation: 0,
      createdAt: new Date().toISOString()
    };

    this.poles.push(pole);
    this.renderPole(pole);
    this.saveState();
    this.updateStats();
    this.showMessage('success', `Pole added. Total: ${this.poles.length}`);
  }

  /**
   * Renders a single pole as a point feature on the map.
   */
  private renderPole(pole: Pole): void {
    const feature = new Feature({
      geometry: new Point(fromLonLat(pole.coordinates)),
      poleId: pole.id
    });
    feature.setId(`pole-${pole.id}`);
    this.poleSource.addFeature(feature);
  }

  /**
   * Finds a pole near the given coordinate (within click tolerance).
   */
  private findPoleAtCoordinate(coordinate: [number, number]): Pole | null {
    const tolerance = this.map.getView().getResolution()! * 10; // 10 pixels tolerance
    
    for (const pole of this.poles) {
      const poleCoord = fromLonLat(pole.coordinates);
      const dx = coordinate[0] - poleCoord[0];
      const dy = coordinate[1] - poleCoord[1];
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < tolerance) {
        return pole;
      }
    }
    return null;
  }

  // ============================================================
  // CANTON MANAGEMENT
  // ============================================================

  /**
   * Handles click during canton drawing mode.
   * Cantons must start and continue with poles only.
   */
  private handleCantonClick(coordinate: [number, number]): void {
    const pole = this.findPoleAtCoordinate(coordinate);
    
    if (!pole) {
      this.showMessage('error', 'Click on a pole to add it to the canton.');
      return;
    }

    // Prevent adding the same pole twice in a row
    if (this.cantonPoleIds.length > 0 && 
        this.cantonPoleIds[this.cantonPoleIds.length - 1] === pole.id) {
      this.showMessage('error', 'Cannot add the same pole consecutively.');
      return;
    }

    this.cantonPoleIds.push(pole.id);
    this.updateTempLine();
    
    const segmentCount = this.cantonPoleIds.length - 1;
    if (segmentCount > 0) {
      this.showMessage('info', `Canton: ${segmentCount} segment(s). Click another pole or switch mode to finish.`);
    } else {
      this.showMessage('info', 'Canton started. Click another pole to add segment.');
    }
  }

  /**
   * Finishes the current canton drawing and saves it.
   */
  private finishCantonDrawing(): void {
    if (this.cantonPoleIds.length < 2) {
      this.showMessage('error', 'A canton needs at least 2 poles.');
      this.cantonPoleIds = [];
      this.tempLineSource.clear();
      return;
    }

    // Create and save the canton
    const canton: Canton = {
      id: this.generateId(),
      poleIds: [...this.cantonPoleIds],
      createdAt: new Date().toISOString()
    };

    this.cantons.push(canton);
    this.renderCanton(canton);
    this.saveState();
    this.updateStats();
    
    // Clean up
    this.cantonPoleIds = [];
    this.tempLineSource.clear();
    this.showMessage('success', `Canton created with ${canton.poleIds.length} poles.`);
  }

  /**
   * Renders a canton as a polyline feature on the map.
   */
  private renderCanton(canton: Canton): void {
    const coordinates = canton.poleIds
      .map(id => this.poles.find(p => p.id === id))
      .filter(p => p !== undefined)
      .map(p => fromLonLat(p!.coordinates));

    if (coordinates.length < 2) return;

    const feature = new Feature({
      geometry: new LineString(coordinates),
      cantonId: canton.id
    });
    feature.setId(`canton-${canton.id}`);
    this.cantonSource.addFeature(feature);
  }

  /**
   * Updates the temporary line showing the current canton being drawn.
   */
  private updateTempLine(): void {
    this.tempLineSource.clear();
    
    if (this.cantonPoleIds.length === 0) return;

    // Get coordinates of all poles in current canton
    const coordinates = this.cantonPoleIds
      .map(id => this.poles.find(p => p.id === id))
      .filter(p => p !== undefined)
      .map(p => fromLonLat(p!.coordinates));

    // Add current mouse position if available
    if (this.lastMousePosition) {
      coordinates.push(this.lastMousePosition);
    }

    if (coordinates.length >= 2) {
      const feature = new Feature({
        geometry: new LineString(coordinates)
      });
      this.tempLineSource.addFeature(feature);
    }
  }

  // ============================================================
  // DRAWING MODE CONTROL
  // ============================================================

  /**
   * Sets the current drawing mode.
   * Finishes any in-progress drawing first.
   */
  setMode(mode: DrawingMode): void {
    // Toggle off if clicking the same mode
    if (this.currentMode === mode) {
      this.finishDrawing();
      return;
    }

    // Finish current operation if changing mode
    if (this.currentMode !== mode) {
      if (this.currentMode === 'canton' && this.cantonPoleIds.length >= 2) {
        this.finishCantonDrawing();
      } else if (this.currentMode === 'canton') {
        this.cantonPoleIds = [];
        this.tempLineSource.clear();
      }
      
      // Clean up rotation mode
      if (this.currentMode === 'rotate') {
        this.selectedPoleId = null;
        this.leverSource.clear();
        this.isRotating = false;
        if (this.dragPanInteraction) {
          this.dragPanInteraction.setActive(true);
        }
        this.poleSource.changed();
      }
    }

    this.currentMode = mode;
    this.modeSubject.next(mode);
    
    // Update cursor style
    const cursor = mode === 'none' ? 'default' : 'crosshair';
    this.map.getTargetElement().style.cursor = cursor;

    // Show mode-specific message
    switch (mode) {
      case 'pole':
        this.showMessage('info', 'Click on map to add poles. Double-click to finish.');
        break;
      case 'canton':
        this.showMessage('info', 'Click on poles to create a canton. Click another tool to finish.');
        break;
      case 'rotate':
        this.showMessage('info', 'Click on a pole to select it, then drag the handle to rotate.');
        break;
      case 'none':
        this.showMessage('info', 'Drawing stopped.');
        break;
    }
  }

  /**
   * Finishes all current drawing operations.
   */
  finishDrawing(): void {
    if (this.currentMode === 'canton' && this.cantonPoleIds.length >= 2) {
      this.finishCantonDrawing();
    }
    this.cantonPoleIds = [];
    this.tempLineSource.clear();
    
    // Clean up rotation mode
    this.selectedPoleId = null;
    if (this.leverSource) this.leverSource.clear();
    this.isRotating = false;
    if (this.dragPanInteraction) {
      this.dragPanInteraction.setActive(true);
    }
    if (this.poleSource) this.poleSource.changed();
    
    this.currentMode = 'none';
    this.modeSubject.next('none');
    
    // Update cursor
    this.map.getTargetElement().style.cursor = 'default';
  }

  /**
   * Returns the current drawing mode.
   */
  getMode(): DrawingMode {
    return this.currentMode;
  }

  // ============================================================
  // STYLING
  // ============================================================

  /**
   * Creates an SVG rectangle icon for poles with rotation support.
   */
  private createPoleSVG(rotation: number, isSelected: boolean): string {
    const width = 12;
    const height = 24;
    const strokeColor = isSelected ? '%23f39c12' : '%23c0392b';
    const fillColor = isSelected ? '%23f1c40f' : '%23ff6b6b';
    const strokeWidth = isSelected ? 3 : 2;
    const halfW = width / 2;
    const halfH = height / 2;
    const lineY = -halfH - 4;
    
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="-20 -20 40 40">' +
      '<g transform="rotate(' + rotation + ')">' +
        '<rect x="' + (-halfW) + '" y="' + (-halfH) + '" width="' + width + '" height="' + height + '" ' +
              'fill="' + fillColor + '" stroke="' + strokeColor + '" stroke-width="' + strokeWidth + '" rx="2" ry="2"/>' +
        '<line x1="0" y1="' + (-halfH) + '" x2="0" y2="' + lineY + '" ' +
              'stroke="' + strokeColor + '" stroke-width="2" stroke-linecap="round"/>' +
      '</g>' +
    '</svg>';
    
    return 'data:image/svg+xml,' + svg;
  }

  /**
   * Returns a style function for pole features.
   */
  private getPoleStyle(feature: Feature): Style {
    const poleId = feature.get('poleId');
    const pole = this.poles.find(p => p.id === poleId);
    const rotation = pole ? (pole.rotation || 0) : 0;
    const isSelected = (this.selectedPoleId === poleId);
    
    return new Style({
      image: new Icon({
        src: this.createPoleSVG(rotation, isSelected),
        scale: 1,
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction'
      })
    });
  }

  /**
   * Creates an SVG for the rotation lever/handle.
   */
  private createLeverSVG(): string {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="-10 -10 20 20">' +
      '<circle cx="0" cy="0" r="8" fill="%23e74c3c" stroke="%23c0392b" stroke-width="2"/>' +
      '<circle cx="0" cy="0" r="4" fill="%23fff"/>' +
    '</svg>';
    return 'data:image/svg+xml,' + svg;
  }

  /**
   * Returns the style for the rotation lever.
   */
  private getLeverStyle(): Style {
    return new Style({
      image: new Icon({
        src: this.createLeverSVG(),
        scale: 1,
        anchor: [0.5, 0.5]
      })
    });
  }

  /**
   * Returns the style for canton polylines.
   */
  private getCantonStyle(): Style {
    return new Style({
      stroke: new Stroke({
        color: '#3498db',
        width: 3
      })
    });
  }

  /**
   * Returns the style for temporary drawing lines.
   */
  private getTempLineStyle(): Style {
    return new Style({
      stroke: new Stroke({
        color: '#f39c12',
        width: 2,
        lineDash: [10, 10]
      })
    });
  }

  // ============================================================
  // PERSISTENCE
  // ============================================================

  /**
   * Saves current state to localStorage.
   */
  private saveState(): void {
    try {
      const state: Project = {
        poles: this.poles,
        cantons: this.cantons
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state:', error);
      this.showMessage('error', 'Failed to save data.');
    }
  }

  /**
   * Loads state from localStorage.
   */
  private loadState(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: Project = JSON.parse(stored);
        this.poles = state.poles || [];
        this.cantons = state.cantons || [];
        
        // Ensure all poles have rotation property
        this.poles.forEach(pole => {
          if (pole.rotation === undefined) {
            pole.rotation = 0;
          }
        });
      }
    } catch (error) {
      console.error('Failed to load state:', error);
      this.poles = [];
      this.cantons = [];
    }
  }

  /**
   * Renders all features from stored data.
   */
  private renderAllFeatures(): void {
    // Render all poles
    this.poles.forEach(pole => this.renderPole(pole));
    
    // Render all cantons
    this.cantons.forEach(canton => this.renderCanton(canton));
  }

  /**
   * Clears all data and resets the application.
   */
  clearAllData(): void {
    this.poles = [];
    this.cantons = [];
    this.poleSource.clear();
    this.cantonSource.clear();
    this.tempLineSource.clear();
    this.leverSource.clear();
    this.cantonPoleIds = [];
    this.selectedPoleId = null;
    this.saveState();
    this.updateStats();
    this.showMessage('success', 'All data cleared.');
  }

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================

  /**
   * Calculates the distance between two map coordinates in meters.
   */
  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const dx = coord1[0] - coord2[0];
    const dy = coord1[1] - coord2[1];
    // Approximate meters from map units at current resolution
    return Math.sqrt(dx * dx + dy * dy) * (this.map.getView().getResolution() || 1);
  }

  /**
   * Generates a unique ID for features.
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Shows a message to the user.
   */
  private showMessage(type: 'success' | 'error' | 'info', text: string): void {
    this.messageSubject.next({ type, text });
    
    // Auto-clear after 5 seconds for non-error messages
    if (type !== 'error') {
      setTimeout(() => {
        const current = this.messageSubject.getValue();
        if (current?.text === text) {
          this.messageSubject.next(null);
        }
      }, 5000);
    }
  }

  /**
   * Updates statistics.
   */
  private updateStats(): void {
    this.statsSubject.next({
      poles: this.poles.length,
      cantons: this.cantons.length
    });
  }

  /**
   * Returns statistics about the current data.
   */
  getStats(): { poles: number; cantons: number } {
    return {
      poles: this.poles.length,
      cantons: this.cantons.length
    };
  }
}

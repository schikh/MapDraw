/**
 * Map Service (Facade)
 * Coordinates map initialization, event handling, and drawing mode control.
 * Delegates to specialized services for styling, persistence, pole/canton operations.
 */

import { Injectable, OnDestroy } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import ScaleLine from 'ol/control/ScaleLine';
import { DragPan } from 'ol/interaction';
import { MapBrowserEvent } from 'ol';
import proj4 from 'proj4';
import { Canton } from '../model/Canton';
import { Pole } from '../model/Pole';
import { Position } from '../model/Position';
import { Project } from '../model/Project';
import { MapStateService, DrawingMode } from './map-state.service';
import { MapStyleService } from './map-style.service';
import { MapPersistenceService } from './map-persistence.service';
import { PoleService } from './pole.service';
import { CantonService } from './canton.service';
import { GeometryCollection } from 'ol/geom';

export { DrawingMode } from './map-state.service';

// ============================================================
// LAMBERT 72 PROJECTION (EPSG:31370)
// ============================================================

const LAMBERT_72_PROJ = '+proj=lcc +lat_1=51.16666723333333 +lat_2=49.8333339 +lat_0=90 +lon_0=4.367486666666666 +x_0=150000.013 +y_0=5400088.438 +ellps=intl +towgs84=-106.8686,52.2978,-103.7239,0.3366,-0.457,1.8422,-1.2747 +units=m +no_defs';

proj4.defs('EPSG:31370', LAMBERT_72_PROJ);

const DEFAULT_CENTER: [number, number] = [4.3517, 50.8503]; // Brussels, Belgium
const DEFAULT_ZOOM = 18;

@Injectable({
  providedIn: 'root'
})
export class MapService implements OnDestroy {
  // Re-expose observables from state service for component consumers
  readonly mode$ = this.state.mode$;
  readonly cursorCoords$ = this.state.cursorCoords$;
  readonly stats$ = this.state.stats$;
  readonly editPole$ = this.state.editPole$;
  readonly editCanton$ = this.state.editCanton$;

  constructor(
    private state: MapStateService,
    private styleService: MapStyleService,
    private persistence: MapPersistenceService,
    private poleService: PoleService,
    private cantonService: CantonService
  ) {}

  ngOnDestroy(): void {
    if (this.state.map) {
      this.state.map.setTarget(undefined);
    }
  }

  // ============================================================
  // MAP INITIALIZATION
  // ============================================================

  /**
   * Initializes the OpenLayers map with all layers and controls.
   * @param targetElement - The DOM element to render the map in
   */
  initializeMap(targetElement: HTMLElement): void {
    this.persistence.loadState();

    this.state.poleSource = new VectorSource();
    this.state.cantonSource = new VectorSource();
    this.state.tempLineSource = new VectorSource();
    this.state.leverSource = new VectorSource();

    this.state.map = new Map({
      target: targetElement,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({
          source: this.state.cantonSource,
          style: (feature) => this.styleService.getCantonStyle(feature as Feature)
        }),
        new VectorLayer({
          source: this.state.tempLineSource,
          style: this.styleService.getTempLineStyle()
        }),
        new VectorLayer({
          source: this.state.poleSource,
          style: (feature) => this.styleService.getPoleStyle(feature as Feature)
        }),
        new VectorLayer({
          source: this.state.leverSource,
          style: this.styleService.getLeverStyle()
        })
      ],
      view: new View({
        center: fromLonLat(DEFAULT_CENTER),
        zoom: DEFAULT_ZOOM
      })
    });

    this.state.map.getInteractions().forEach((interaction) => {
      if (interaction instanceof DragPan) {
        this.state.dragPanInteraction = interaction;
      }
    });

    const scaleLine = new ScaleLine({
      units: 'metric',
      bar: true,
      steps: 5,
      text: true,
      minWidth: 140,
    });
    this.state.map.addControl(scaleLine);

    this.setupEventListeners();
    this.renderAllFeatures();
    this.state.updateStats();
    this.state.showMessage('info', 'Ready. Select a drawing tool to begin.');
  }

  // ============================================================
  // EVENT HANDLING
  // ============================================================

  /**
   * Sets up all map event listeners for drawing and interaction.
   */
  private setupEventListeners(): void {
    const map = this.state.map;

    // Track mouse position for coordinates display and temp line
    map.on('pointermove', (event) => {
      const lonLat = toLonLat(event.coordinate);
      const lambert72 = proj4('EPSG:4326', 'EPSG:31370', lonLat);
      this.state.setCursorCoords(`Lambert 72: X=${lambert72[0].toFixed(2)} m, Y=${lambert72[1].toFixed(2)} m`);

      if (this.state.currentMode === 'canton' && this.state.cantonPoleIds.length > 0) {
        this.state.lastMousePosition = event.coordinate as [number, number];
        this.cantonService.updateTempLine();
      }

      if (this.state.isRotating && this.state.selectedPoleId) {
        this.handleRotationDrag(event.coordinate as [number, number]);
      }

      if (this.state.isMoving && this.state.selectedPoleId) {
        this.handleMoveDrag(event.coordinate as [number, number]);
      }

      this.updateCursor(event.coordinate as [number, number]);
    });

    map.on('click', (event) => {
      this.handleMapClick(event.coordinate as [number, number]);
    });

    map.on('dblclick', (event) => {
      event.preventDefault();
      this.handleDoubleClick(event.coordinate as [number, number]);
    });

    // @ts-ignore - pointerdrag is a valid OpenLayers event
    map.on('pointerdrag', (event: MapBrowserEvent<PointerEvent>) => {
      if (this.state.currentMode === 'rotate' && this.state.selectedPoleId) {
        const leverFeature = this.state.leverSource.getFeatures()[0];
        if (leverFeature) {
          const leverCoord = (leverFeature.getGeometry() as Point).getCoordinates();
          const distance = Math.sqrt(
            Math.pow(event.coordinate[0] - leverCoord[0], 2) +
            Math.pow(event.coordinate[1] - leverCoord[1], 2)
          );
          const tolerance = map.getView().getResolution()! * 20;
          if (distance < tolerance || this.state.isRotating) {
            this.state.isRotating = true;
            if (this.state.dragPanInteraction) {
              this.state.dragPanInteraction.setActive(false);
            }
            this.handleRotationDrag(event.coordinate as [number, number]);
            event.preventDefault();
          }
        }
      }

      if (this.state.currentMode === 'move' && this.state.selectedPoleId) {
        const poleFeature = this.state.poleSource.getFeatureById(`pole-${this.state.selectedPoleId}`) as Feature;
        if (poleFeature) {
          //const poleCoord = (poleFeature.getGeometry() as Point).getCoordinates();
          const geometries = poleFeature.getGeometry() as GeometryCollection;
          const poleCoord = (geometries.getGeometries()[0] as Point).getCoordinates();
          //const poleCoord = (poleFeature.getGeometry() as Point).getCoordinates();
          const distance = Math.sqrt(
            Math.pow(event.coordinate[0] - poleCoord[0], 2) +
            Math.pow(event.coordinate[1] - poleCoord[1], 2)
          );
          const tolerance = map.getView().getResolution()! * 20;
          if (distance < tolerance || this.state.isMoving) {
            this.state.isMoving = true;
            if (this.state.dragPanInteraction) {
              this.state.dragPanInteraction.setActive(false);
            }
            this.handleMoveDrag(event.coordinate as [number, number]);
            event.preventDefault();
          }
        }
      }
    });

    const viewport = map.getViewport();
    viewport.addEventListener('pointerup', () => {
      if (this.state.isRotating) {
        this.state.isRotating = false;
        if (this.state.dragPanInteraction) {
          this.state.dragPanInteraction.setActive(true);
        }
        this.persistence.saveState();
        this.state.showMessage('success', 'Pole rotation updated.');
      }
      if (this.state.isMoving) {
        this.state.isMoving = false;
        if (this.state.dragPanInteraction) {
          this.state.dragPanInteraction.setActive(true);
        }
        this.persistence.saveState();
        this.state.showMessage('success', 'Pole moved successfully.');
      }
    });

    map.getTargetElement().style.cursor = 'default';
  }

  /**
   * Updates cursor style based on current mode and what's under the pointer.
   */
  private updateCursor(coordinate: [number, number]): void {
    const mode = this.state.currentMode;
    const el = this.state.map.getTargetElement();

    if (mode === 'move') {
      if (this.state.isMoving) {
        el.style.cursor = 'grabbing';
      } else {
        el.style.cursor = this.poleService.findPoleAtCoordinate(coordinate) ? 'grab' : 'crosshair';
      }
    } else if (mode === 'remove-canton') {
      el.style.cursor = this.cantonService.findCantonAtCoordinate(coordinate) ? 'pointer' : 'crosshair';
    } else if (mode === 'remove-pole') {
      el.style.cursor = this.poleService.findPoleAtCoordinate(coordinate) ? 'pointer' : 'crosshair';
    } else if (mode === 'none') {
      const hoverPole = this.poleService.findPoleAtCoordinate(coordinate);
      const hoverCanton = !hoverPole && this.cantonService.findCantonAtCoordinate(coordinate);
      el.style.cursor = (hoverPole || hoverCanton) ? 'pointer' : 'default';
    }
  }

  // ============================================================
  // CLICK HANDLERS
  // ============================================================

  /**
   * Handles single click on the map based on current drawing mode.
   */
  private handleMapClick(coordinate: [number, number]): void {
    switch (this.state.currentMode) {
      case 'none':
        this.handleInspectClick(coordinate);
        break;
      case 'pole':
        this.poleService.addPole(coordinate);
        break;
      case 'canton':
        this.cantonService.handleCantonClick(coordinate);
        break;
      case 'rotate':
        this.handleRotateClick(coordinate);
        break;
      case 'move':
        this.handleMoveClick(coordinate);
        break;
      case 'remove-canton':
        this.handleRemoveCantonClick(coordinate);
        break;
      case 'remove-pole':
        this.handleRemovePoleClick(coordinate);
        break;
    }
  }

  /**
   * Handles click in 'none' mode: opens the edit modal for the clicked pole or canton.
   */
  private handleInspectClick(coordinate: [number, number]): void {
    const pole = this.poleService.findPoleAtCoordinate(coordinate);
    if (pole) {
      this.state.emitEditPole(pole);
      return;
    }
    const canton = this.cantonService.findCantonAtCoordinate(coordinate);
    if (canton) {
      this.state.emitEditCanton(canton);
    }
  }

  /**
   * Handles click in remove-pole mode.
   * First click selects/highlights a pole; second click on the same pole removes it.
   */
  private handleRemovePoleClick(coordinate: [number, number]): void {
    const pole = this.poleService.findPoleAtCoordinate(coordinate);

    if (pole) {
      if (this.state.selectedPoleId === pole.id) {
        const linkedCanton = this.state.project.cantons.find(c => c.poleIds.includes(pole.id));
        if (linkedCanton) {
          this.state.showMessage('error', 'Cannot remove pole: it is linked to one or more cantons. Remove those cantons first.');
          return;
        }
        this.poleService.removePole(pole.id);
      } else {
        this.state.selectedPoleId = pole.id;
        this.state.poleSource.changed();
        this.state.showMessage('info', 'Pole selected. Click it again to delete it.');
      }
    } else {
      if (this.state.selectedPoleId) {
        this.state.selectedPoleId = null;
        this.state.poleSource.changed();
        this.state.showMessage('info', 'Click on a pole to select it for removal.');
      }
    }
  }

  /**
   * Handles click in remove-canton mode.
   * First click selects/highlights a canton; second click on the same canton removes it.
   */
  private handleRemoveCantonClick(coordinate: [number, number]): void {
    const canton = this.cantonService.findCantonAtCoordinate(coordinate);

    if (canton) {
      if (this.state.selectedCantonId === canton.id) {
        this.cantonService.removeCanton(canton.id);
      } else {
        this.state.selectedCantonId = canton.id;
        this.state.cantonSource.changed();
        this.state.showMessage('info', 'Canton selected. Click it again to delete it.');
      }
    } else {
      if (this.state.selectedCantonId) {
        this.state.selectedCantonId = null;
        this.state.cantonSource.changed();
        this.state.showMessage('info', 'Click on a canton to select it for removal.');
      }
    }
  }

  /**
   * Handles click in move mode - selects a pole to move.
   */
  private handleMoveClick(coordinate: [number, number]): void {
    if (this.state.isMoving) return;
    const pole = this.poleService.findPoleAtCoordinate(coordinate);

    if (pole) {
      this.state.selectedPoleId = pole.id;
      this.state.poleSource.changed();
      this.state.showMessage('info', 'Pole selected. Drag it to move to a new position.');
    } else {
      if (this.state.selectedPoleId) {
        this.state.selectedPoleId = null;
        this.state.poleSource.changed();
        this.state.showMessage('info', 'Click on a pole to select it for moving.');
      }
    }
  }

  /**
   * Handles click in rotate mode - selects a pole to rotate.
   */
  private handleRotateClick(coordinate: [number, number]): void {
    const pole = this.poleService.findPoleAtCoordinate(coordinate);

    if (pole) {
      this.state.selectedPoleId = pole.id;
      this.updateLever();
      this.state.poleSource.changed();
      this.state.showMessage('info', 'Pole selected. Drag the red handle to rotate.');
    } else {
      if (this.state.selectedPoleId) {
        this.state.selectedPoleId = null;
        this.state.leverSource.clear();
        this.state.poleSource.changed();
        this.state.showMessage('info', 'Click on a pole to select it for rotation.');
      }
    }
  }

  /**
   * Handles double-click to finish pole addition or canton drawing.
   */
  private handleDoubleClick(coordinate: [number, number]): void {
    if (this.state.currentMode === 'pole') {
      const clickedPole = this.poleService.findPoleAtCoordinate(coordinate);
      if (clickedPole) {
        this.finishDrawing();
        this.state.showMessage('success', 'Pole drawing completed.');
      } else {
        this.finishDrawing();
        this.state.showMessage('info', 'Pole drawing stopped.');
      }
    } else if (this.state.currentMode === 'canton') {
      this.cantonService.finishCantonDrawing();
    }
  }

  // ============================================================
  // ROTATION & MOVE
  // ============================================================

  /**
   * Handles dragging to move the selected pole to a new position.
   */
  private handleMoveDrag(coordinate: [number, number]): void {
    const pole = this.state.project.poles.find(p => p.id === this.state.selectedPoleId);
    if (!pole) return;

    const lonLat = toLonLat(coordinate) as [number, number];
    pole.position = new Position(lonLat[0], lonLat[1], pole.position.z);

    const feature = this.state.poleSource.getFeatureById(`pole-${pole.id}`) as Feature;
    if (feature) {
      feature.setGeometry(PoleService.getPoleDrawing(lonLat[0], lonLat[1]));
    }

    this.cantonService.refreshCantonFeatures();
  }

  /**
   * Handles dragging to rotate the selected pole.
   */
  private handleRotationDrag(coordinate: [number, number]): void {
    const pole = this.state.project.poles.find(p => p.id === this.state.selectedPoleId);
    if (!pole) return;

    const poleCoord = fromLonLat([pole.position.x, pole.position.y]);
    const dx = coordinate[0] - poleCoord[0];
    const dy = coordinate[1] - poleCoord[1];
    let angle = Math.atan2(dx, dy) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    pole.rotation = Math.round(angle);
    this.updateLever();
    this.state.poleSource.changed();

    this.cantonService.refreshCantonFeatures();    
  }

  /**
   * Updates the rotation lever position for the selected pole.
   */
  private updateLever(): void {
    this.state.leverSource.clear();
    if (!this.state.selectedPoleId) return;

    const pole = this.state.project.poles.find(p => p.id === this.state.selectedPoleId);
    if (!pole) return;

    const poleCoord = fromLonLat([pole.position.x, pole.position.y]);
    const rotation = pole.rotation || 0;
    const leverDistance = this.state.map.getView().getResolution()! * 40;
    const angleRad = rotation * (Math.PI / 180);
    const leverX = poleCoord[0] + leverDistance * Math.sin(angleRad);
    const leverY = poleCoord[1] + leverDistance * Math.cos(angleRad);

    const leverFeature = new Feature({
      geometry: new Point([leverX, leverY])
    });
    this.state.leverSource.addFeature(leverFeature);
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
    if (this.state.currentMode === mode) {
      this.finishDrawing();
      return;
    }

    // Clean up the mode being left
    if (this.state.currentMode === 'canton' && this.state.cantonPoleIds.length >= 2) {
      this.cantonService.finishCantonDrawing();
    } else if (this.state.currentMode === 'canton') {
      this.state.cantonPoleIds = [];
      this.state.tempLineSource.clear();
    }

    if (this.state.currentMode === 'rotate') {
      this.state.selectedPoleId = null;
      this.state.leverSource.clear();
      this.state.isRotating = false;
      if (this.state.dragPanInteraction) this.state.dragPanInteraction.setActive(true);
      this.state.poleSource.changed();
    }

    if (this.state.currentMode === 'move') {
      this.state.selectedPoleId = null;
      this.state.isMoving = false;
      if (this.state.dragPanInteraction) this.state.dragPanInteraction.setActive(true);
      this.state.poleSource.changed();
    }

    if (this.state.currentMode === 'remove-canton') {
      this.state.selectedCantonId = null;
      this.state.cantonSource.changed();
    }

    if (this.state.currentMode === 'remove-pole') {
      this.state.selectedPoleId = null;
      this.state.poleSource.changed();
    }

    this.state.setMode(mode);
    this.state.map.getTargetElement().style.cursor = mode === 'none' ? 'default' : 'crosshair';

    const messages: Record<DrawingMode, string> = {
      'pole': 'Click on map to add poles. Double-click to finish.',
      'canton': 'Click on poles to create a canton. Click another tool to finish.',
      'rotate': 'Click on a pole to select it, then drag the handle to rotate.',
      'move': 'Click on a pole to select it, then drag to move it.',
      'remove-canton': 'Click on a canton to select it, then click again to remove it.',
      'remove-pole': 'Click on a pole to select it, then click again to remove it.',
      'none': 'Drawing stopped.'
    };
    this.state.showMessage('info', messages[mode]);
  }

  /**
   * Finishes all current drawing operations.
   */
  finishDrawing(): void {
    if (this.state.currentMode === 'canton' && this.state.cantonPoleIds.length >= 2) {
      this.cantonService.finishCantonDrawing();
    }
    this.state.cantonPoleIds = [];
    this.state.tempLineSource.clear();

    // Clean up rotation / move / remove-canton mode
    this.state.selectedPoleId = null;
    this.state.selectedCantonId = null;
    if (this.state.leverSource) this.state.leverSource.clear();
    if (this.state.cantonSource) this.state.cantonSource.changed();
    this.state.isRotating = false;
    this.state.isMoving = false;
    if (this.state.dragPanInteraction) {
      this.state.dragPanInteraction.setActive(true);
    }
    if (this.state.poleSource) this.state.poleSource.changed();

    this.state.setMode('none');
    this.state.map.getTargetElement().style.cursor = 'default';
  }

  // ============================================================
  // PUBLIC API (delegated)
  // ============================================================

  /** Applies edited pole data and persists. */
  updatePole(updated: Pole): void {
    this.poleService.updatePole(updated);
  }

  /** Applies edited canton data and persists. */
  updateCanton(updated: Canton): void {
    this.cantonService.updateCanton(updated);
  }

  /** Returns the current drawing mode. */
  getMode(): DrawingMode {
    return this.state.getMode();
  }

  /** Returns statistics about the current data. */
  getStats(): { poles: number; cantons: number } {
    return this.state.getStats();
  }

  /** Clears all data and resets the application. */
  clearAllData(): void {
    this.state.project = new Project([], []);
    this.state.poleSource.clear();
    this.state.cantonSource.clear();
    this.state.tempLineSource.clear();
    this.state.leverSource.clear();
    this.state.cantonPoleIds = [];
    this.state.selectedPoleId = null;
    this.persistence.saveState();
    this.state.updateStats();
    this.state.showMessage('success', 'All data cleared.');
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  /** Renders all features from stored data. */
  private renderAllFeatures(): void {
    this.state.project.poles.forEach(pole => this.poleService.renderPole(pole));
    this.state.project.cantons.forEach(canton => this.cantonService.renderCanton(canton));
  }
}

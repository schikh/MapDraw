/**
 * Canton Service
 * Manages canton creation, removal, rendering, spatial queries, and temporary drawing line.
 */

import { Injectable } from '@angular/core';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import { fromLonLat } from 'ol/proj';
import { Canton } from '../model/Canton';
import { Pole } from '../model/Pole';
import { MapStateService } from './map-state.service';
import { MapPersistenceService } from './map-persistence.service';
import { PoleService } from './pole.service';

@Injectable({
  providedIn: 'root'
})
export class CantonService {

  constructor(
    private state: MapStateService,
    private persistence: MapPersistenceService,
    private poleService: PoleService
  ) {}

  // ============================================================
  // CANTON DRAWING
  // ============================================================

  /**
   * Handles click during canton drawing mode.
   * Cantons must start and continue with poles only.
   */
  handleCantonClick(coordinate: [number, number]): void {
    const pole = this.poleService.findPoleAtCoordinate(coordinate);

    if (!pole) {
      this.state.showMessage('error', 'Click on a pole to add it to the canton.');
      return;
    }

    // Prevent adding the same pole twice in a row
    if (this.state.cantonPoleIds.length > 0 &&
        this.state.cantonPoleIds[this.state.cantonPoleIds.length - 1] === pole.id) {
      this.state.showMessage('error', 'Cannot add the same pole consecutively.');
      return;
    }

    this.state.cantonPoleIds.push(pole.id);
    this.updateTempLine();

    const segmentCount = this.state.cantonPoleIds.length - 1;
    if (segmentCount > 0) {
      this.state.showMessage('info', `Canton: ${segmentCount} segment(s). Click another pole or switch mode to finish.`);
    } else {
      this.state.showMessage('info', 'Canton started. Click another pole to add segment.');
    }
  }

  /**
   * Finishes the current canton drawing and saves it.
   */
  finishCantonDrawing(): void {
    if (this.state.cantonPoleIds.length < 2) {
      this.state.showMessage('error', 'A canton needs at least 2 poles.');
      this.state.cantonPoleIds = [];
      this.state.tempLineSource.clear();
      return;
    }

    // Create the canton and wire up Sections via addPole()
    const canton = new Canton();
    const resolvedPoles = this.state.cantonPoleIds
      .map(id => this.state.project.poles.find(p => p.id === id)!)
      .filter((p): p is Pole => p !== undefined);
    for (const pole of resolvedPoles) {
      canton.addPole(pole); // automatically creates Section objects
    }

    this.state.project.cantons.push(canton);
    this.renderCanton(canton);
    this.persistence.saveState();
    this.state.updateStats();

    // Clean up
    this.state.cantonPoleIds = [];
    this.state.tempLineSource.clear();
    this.state.showMessage('success', `Canton created with ${canton.poleIds.length} poles.`);
  }

  // ============================================================
  // CANTON CRUD
  // ============================================================

  /**
   * Removes the canton with the given id from data and map.
   */
  removeCanton(cantonId: string): void {
    this.state.project.cantons = this.state.project.cantons.filter(c => c.id !== cantonId);
    const feature = this.state.cantonSource.getFeatureById(`canton-${cantonId}`);
    if (feature) this.state.cantonSource.removeFeature(feature);
    this.state.selectedCantonId = null;
    this.persistence.saveState();
    this.state.updateStats();
    this.state.showMessage('success', 'Canton removed.');
  }

  /**
   * Applies edited canton data and persists.
   */
  updateCanton(updated: Canton): void {
    const canton = this.state.project.cantons.find(c => c.id === updated.id);
    if (!canton) return;
    // Currently no user-editable canton fields beyond those shown;
    // extend here when new fields are added.
    this.persistence.saveState();
    this.state.showMessage('success', 'Canton saved.');
  }

  // ============================================================
  // RENDERING
  // ============================================================

  /**
   * Renders a canton as a polyline feature on the map.
   */
  renderCanton(canton: Canton): void {
    const coordinates = canton.poleIds
      .map(id => this.state.project.poles.find(p => p.id === id))
      .filter((p): p is Pole => p !== undefined)
      .map(p => fromLonLat([p.position.x, p.position.y]));

    if (coordinates.length < 2) return;

    const feature = new Feature({
      geometry: new LineString(coordinates),
      cantonId: canton.id
    });
    feature.setId(`canton-${canton.id}`);
    this.state.cantonSource.addFeature(feature);
  }

  /**
   * Re-renders all canton features (used after a pole is moved).
   */
  refreshCantonFeatures(): void {
    this.state.cantonSource.clear();
    this.state.project.cantons.forEach(canton => this.renderCanton(canton));
  }

  // ============================================================
  // TEMP LINE (during canton drawing)
  // ============================================================

  /**
   * Updates the temporary line showing the current canton being drawn.
   */
  updateTempLine(): void {
    this.state.tempLineSource.clear();

    if (this.state.cantonPoleIds.length === 0) return;

    // Get coordinates of all poles in current canton
    const coordinates = this.state.cantonPoleIds
      .map(id => this.state.project.poles.find(p => p.id === id))
      .filter((p): p is Pole => p !== undefined)
      .map(p => fromLonLat([p.position.x, p.position.y]));

    // Add current mouse position if available
    if (this.state.lastMousePosition) {
      coordinates.push(this.state.lastMousePosition);
    }

    if (coordinates.length >= 2) {
      const feature = new Feature({
        geometry: new LineString(coordinates)
      });
      this.state.tempLineSource.addFeature(feature);
    }
  }

  // ============================================================
  // SPATIAL QUERIES
  // ============================================================

  /**
   * Finds a canton whose polyline passes within click tolerance of the given coordinate.
   */
  findCantonAtCoordinate(coordinate: [number, number]): Canton | null {
    const tolerance = this.state.map.getView().getResolution()! * 10;

    for (const canton of this.state.project.cantons) {
      const feature = this.state.cantonSource.getFeatureById(`canton-${canton.id}`) as Feature;
      if (!feature) continue;
      const coords = (feature.getGeometry() as LineString).getCoordinates();
      for (let i = 0; i < coords.length - 1; i++) {
        const dist = this.pointToSegmentDistance(
          coordinate,
          coords[i] as [number, number],
          coords[i + 1] as [number, number]
        );
        if (dist < tolerance) return canton;
      }
    }
    return null;
  }

  /**
   * Returns the perpendicular distance from point p to segment [a, b].
   */
  private pointToSegmentDistance(p: [number, number], a: [number, number], b: [number, number]): number {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const lenSq = dx * dx + dy * dy;
    let t = 0;
    if (lenSq > 0) {
      t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }
    const ex = p[0] - (a[0] + t * dx);
    const ey = p[1] - (a[1] + t * dy);
    return Math.sqrt(ex * ex + ey * ey);
  }
}

/**
 * Pole Service
 * Manages pole creation, removal, rendering, and spatial queries.
 */

import { Injectable } from '@angular/core';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Pole } from '../model/Pole';
import { MapStateService } from './map-state.service';
import { MapPersistenceService } from './map-persistence.service';
import { Position } from '../model/Position';
import { GeometryCollection, LineString } from 'ol/geom';

const MIN_POLE_DISTANCE_METERS = 0.5; // 50cm minimum distance between poles
const DEFAULT_CENTER_LAT = 50.8503;   // Brussels latitude for distance correction

@Injectable({
  providedIn: 'root'
})
export class PoleService {

  constructor(
    private state: MapStateService,
    private persistence: MapPersistenceService
  ) {}

  // ============================================================
  // POLE CRUD
  // ============================================================

  /**
   * Adds a new pole at the specified map coordinate.
   * Validates minimum distance from existing poles.
   */
  addPole(coordinate: [number, number]): void {

    const tooClose = this.state.project.poles.some(pole => {
      const poleCoord = fromLonLat([pole.position.x, pole.position.y]) as [number, number];
      const distance = this.calculateDistance(coordinate, poleCoord);
      return distance < MIN_POLE_DISTANCE_METERS;
    });

    if (tooClose) {
      this.state.showMessage('error', 'Cannot place pole within 50cm of another pole.');
      return;
    }

    const lonLat = toLonLat(coordinate) as [number, number];
    const pole = new Pole(
      this.state.project.getNextPoleId(), 500, 12, 0, 10,
      new Position(lonLat[0], lonLat[1], 0)
    );

    this.state.project.poles.push(pole);
    this.renderPole(pole);
    this.persistence.saveState();
    this.state.updateStats();
    this.state.showMessage('success', `Pole added. Total: ${this.state.project.poles.length}`);
  }

  /**
   * Removes the pole with the given id from data and map.
   */
  removePole(poleId: number): void {
    this.state.project.poles = this.state.project.poles.filter(p => p.id !== poleId);
    const feature = this.state.poleSource.getFeatureById(`pole-${poleId}`);
    if (feature) this.state.poleSource.removeFeature(feature as Feature);
    this.state.selectedPoleId = null;
    this.persistence.saveState();
    this.state.updateStats();
    this.state.showMessage('success', 'Pole removed.');
  }

  /**
   * Applies edited pole data and persists.
   */
  updatePole(updated: Pole): void {
    const pole = this.state.project.poles.find(p => p.id === updated.id);
    
    if (!pole) return;
    
    pole.strength = updated.strength;
    pole.height = updated.height;
    pole.rotation = updated.rotation;
    pole.aboveGroundHeight = updated.aboveGroundHeight;

    this.state.poleSource.changed();
    this.persistence.saveState();
    this.state.showMessage('success', 'Pole updated.');
  }

  // ============================================================
  // RENDERING
  // ============================================================

  /**
   * Renders a single pole as a point feature on the map.
   */
  renderPole(pole: Pole): void {
    const poleGeometry = PoleService.getPoleDrawing(pole.position.x, pole.position.y);

    const feature = new Feature({ 
      pole: pole, // <= store the whole pole object in the feature
      geometry: poleGeometry
    });

    feature.setId(`pole-${pole.id}`);    
    this.state.poleSource.addFeature(feature);
  }

  static getPoleDrawing(x: number, y: number): GeometryCollection {
    return new GeometryCollection([
      new Point(fromLonLat([x, y])),
      new LineString([
        fromLonLat([x, y]),
        fromLonLat([x + 0.0005, y + 0.0005])
      ])
    ]);
  }

  // ============================================================
  // SPATIAL QUERIES
  // ============================================================

  /**
   * Finds a pole near the given coordinate (within click tolerance).
   */
  findPoleAtCoordinate(coordinate: [number, number]): Pole | null {
    
    //TODO: replace logic by retrieving the feature at coordinate and getting pole from it
    
    const tolerance = this.state.map.getView().getResolution()! * 10; // 10 pixels tolerance

    for (const pole of this.state.project.poles) {
      const poleCoord = fromLonLat([pole.position.x, pole.position.y]);
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
  // UTILITIES
  // ============================================================

  /**
   * Approximate true distance (metres) between two EPSG:3857 coordinates.
   * EPSG:3857 pseudometres are stretched by 1/cos(lat) relative to real metres;
   * multiplying back by cos(lat) converts them to real-world metres.
   */
  private calculateDistance(coord1: [number, number], coord2: [number, number]): number {
    const dx = coord1[0] - coord2[0];
    const dy = coord1[1] - coord2[1];
    const latRad = DEFAULT_CENTER_LAT * Math.PI / 180;
    return Math.sqrt(dx * dx + dy * dy) * Math.cos(latRad);
  }
}

/**
 * App Component
 * Main application component that orchestrates the layout.
 * Includes header, sidebar, map, and footer.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { MapComponent } from './components/map/map.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    FooterComponent,
    SidebarComponent,
    MapComponent
  ],
  template: `
    <div class="app-container">
      <!-- Header with Navigation -->
      <app-header></app-header>

      <!-- Main Content Area -->
      <main class="main-content">
        <!-- Sidebar with Drawing Tools -->
        <app-sidebar></app-sidebar>

        <!-- Map Display -->
        <div class="map-area">
          <app-map></app-map>
        </div>
      </main>

      <!-- Footer -->
      <app-footer></app-footer>
    </div>
  `,
  styles: []
})
export class AppComponent {
  title = 'MapDraw - Pole & Canton Drawing Application';
}

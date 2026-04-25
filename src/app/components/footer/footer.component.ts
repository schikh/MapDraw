/**
 * Footer Component
 * Static footer with copyright text.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="footer bg-body border-top border-secondary">
      <div class="container-fluid py-2">
        <div class="row align-items-center">
          <!-- Copyright Text -->
          <div class="col-12 col-md-6 text-center text-md-start">
            <small class="text-muted">
              <i class="bi bi-c-circle me-1"></i>
              {{ currentYear }} MapDraw Application. All rights reserved.
            </small>
          </div>
          
          <!-- Additional Info -->
          <div class="col-12 col-md-6 text-center text-md-end mt-2 mt-md-0">
            <small class="text-muted">
              <i class="bi bi-geo-alt me-1"></i>
              Powered by OpenLayers & OpenStreetMap
            </small>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: []
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}

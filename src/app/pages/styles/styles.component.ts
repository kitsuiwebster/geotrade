import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

interface StyleImage {
  location: string;
  locationLabel: string;
  style: string;
  styleLabel: string;
  path: string;
}

const LOCATIONS: { id: string; label: string }[] = [
  { id: 'paris', label: 'Paris' },
  { id: 'canary-islands', label: 'Canary Islands' },
  { id: 'atlanta', label: 'Atlanta' },
  { id: 'mediterranean', label: 'Mediterranean' },
  { id: 'vinson', label: 'Mount Vinson' },
];

const STYLES: { id: string; label: string }[] = [
  { id: '01_ink_watercolor', label: 'Ink Watercolor' },
  { id: '02_oil_painting', label: 'Oil Painting' },
  { id: '03_concept_art', label: 'Concept Art' },
  { id: '04_impressionist', label: 'Impressionist' },
  { id: '05_studio_ghibli', label: 'Studio Ghibli' },
  { id: '06_digital_illustration', label: 'Digital Illustration' },
  { id: '07_comic_art', label: 'Comic Art' },
  { id: '08_watercolor_vivid', label: 'Watercolor Vivid' },
  { id: '09_vintage_travel_poster', label: 'Vintage Travel Poster' },
  { id: '10_cinematic_painting', label: 'Cinematic Painting' },
];

@Component({
  selector: 'app-styles',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './styles.component.html',
  styleUrls: ['./styles.component.scss']
})
export class StylesComponent {
  locations = LOCATIONS;
  styles = STYLES;

  selectedLocation = 'all';
  selectedStyle = 'all';
  lightboxImage: StyleImage | null = null;

  readonly images: StyleImage[] = LOCATIONS.flatMap(loc =>
    STYLES.map(sty => ({
      location: loc.id,
      locationLabel: loc.label,
      style: sty.id,
      styleLabel: sty.label,
      path: `assets/styles-test/${loc.id}/${sty.id}.jpg`,
    }))
  );

  get filtered(): StyleImage[] {
    return this.images.filter(img => {
      const locMatch = this.selectedLocation === 'all' || img.location === this.selectedLocation;
      const styMatch = this.selectedStyle === 'all' || img.style === this.selectedStyle;
      return locMatch && styMatch;
    });
  }

  openLightbox(img: StyleImage): void {
    this.lightboxImage = img;
  }

  closeLightbox(): void {
    this.lightboxImage = null;
  }
}

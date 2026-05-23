import { Injectable, signal, effect } from '@angular/core';
import { Card } from '../interfaces/card.interface';
import { AI_MANIFEST } from '../data/ai-manifest';

const AI_IMAGE_SET = new Set(AI_MANIFEST);

@Injectable({ providedIn: 'root' })
export class CardDisplayService {
  readonly showAiImages = signal(false);
  readonly showBorders = signal(false);

  constructor() {
    effect(() => {
      if (this.showBorders()) {
        document.body.classList.add('preview-borders');
      } else {
        document.body.classList.remove('preview-borders');
      }
    });
  }

  hasAiImage(card: Card): boolean {
    const relative = card.image.replace('assets/images/cards/', '').replace(/\.[^.]+$/, '.jpg');
    return AI_IMAGE_SET.has(relative);
  }

  getAiImageUrl(card: Card): string {
    const relative = card.image.replace('assets/images/cards/', '').replace(/\.[^.]+$/, '.jpg');
    return `assets/images/ai/${relative}`;
  }

  toggleAiImages(): void {
    this.showAiImages.update(v => !v);
  }

  toggleBorders(): void {
    this.showBorders.update(v => !v);
  }
}

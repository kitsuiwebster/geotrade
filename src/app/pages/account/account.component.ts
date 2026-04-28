import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SupabaseService, Profile } from '../../services/supabase.service';
import { allCardsData, allCitiesData, countriesData } from '../../data';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  profile: Profile | null = null;
  totalCards = 0;
  readonly totalCardsAvailable = allCardsData.length;
  readonly countries = countriesData.map(c => c.nom).sort();

  get filteredCityOptions(): string[] {
    const term = (this.editForm.city || '').toLowerCase().trim();
    if (!term) return [];
    const all = allCitiesData.map(c => c.nom);
    return Array.from(new Set(all))
      .filter(n => n.toLowerCase().includes(term))
      .sort()
      .slice(0, 50);
  }

  openCitySuggestions() {
    this.showCitySuggestions = true;
  }

  selectCity(name: string) {
    this.editForm.city = name;
    this.showCitySuggestions = false;
  }

  editForm = { display_name: '', country: '', city: '' };
  passwordForm = { newPassword: '', confirmPassword: '' };

  loading = false;
  saveSuccess = false;
  passwordSuccess = false;

  showCitySuggestions = false;

  constructor(private supabase: SupabaseService, private router: Router) {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.city-field-wrapper')) {
        this.showCitySuggestions = false;
      }
    });
  }

  async ngOnInit() {
    const user = this.supabase.currentUser;
    if (!user) { this.router.navigate(['/login']); return; }

    const { data } = await this.supabase.getProfile(user.id);
    if (data) {
      this.profile = data;
      this.editForm = {
        display_name: data.display_name,
        country: data.country,
        city: data.city ?? ''
      };
    }

    const cardIds = await this.supabase.getUserCardIds(user.id);
    this.totalCards = cardIds.length;
  }

  getCollectionPercentage(): number {
    return this.totalCardsAvailable > 0
      ? Math.round((this.totalCards / this.totalCardsAvailable) * 100)
      : 0;
  }

  async updateAccount() {
    const user = this.supabase.currentUser;
    if (!user) return;
    this.loading = true;
    await this.supabase.updateProfile(user.id, {
      display_name: this.editForm.display_name,
      country: this.editForm.country,
      city: this.editForm.city || null
    });
    if (this.profile) {
      this.profile.display_name = this.editForm.display_name;
      this.profile.country = this.editForm.country;
      this.profile.city = this.editForm.city || null;
    }
    this.loading = false;
    this.saveSuccess = true;
    setTimeout(() => (this.saveSuccess = false), 2000);
  }

  isPasswordFormValid(): boolean {
    return this.passwordForm.newPassword.length >= 6 &&
      this.passwordForm.newPassword === this.passwordForm.confirmPassword;
  }

  async changePassword() {
    if (!this.isPasswordFormValid()) return;
    this.loading = true;
    await this.supabase.updatePassword(this.passwordForm.newPassword);
    this.loading = false;
    this.passwordForm = { newPassword: '', confirmPassword: '' };
    this.passwordSuccess = true;
    setTimeout(() => (this.passwordSuccess = false), 2000);
  }

  async logout() {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }

  previewProfile() {
    const user = this.supabase.currentUser;
    if (user) window.open(`/user/${user.id}`, '_blank');
  }
}

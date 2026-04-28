import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { countriesData } from '../../data';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form = { username: '', displayName: '', email: '', password: '', country: '' };
  error = '';
  loading = false;
  readonly countries = countriesData.map(c => c.nom).sort();

  constructor(private supabase: SupabaseService, private router: Router) {}

  async submit() {
    this.loading = true;
    this.error = '';
    const { error } = await this.supabase.signUp(
      this.form.email,
      this.form.password,
      { username: this.form.username, display_name: this.form.displayName, country: this.form.country }
    );
    this.loading = false;
    if (error) {
      this.error = error.message;
    } else {
      this.router.navigate(['/quizzes']);
    }
  }
}

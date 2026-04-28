import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form = { email: '', password: '' };
  error = '';
  loading = false;

  constructor(private supabase: SupabaseService, private router: Router) {}

  async submit() {
    this.loading = true;
    this.error = '';
    const { error } = await this.supabase.signIn(this.form.email, this.form.password);
    this.loading = false;
    if (error) {
      this.error = error.message;
    } else {
      this.router.navigate(['/quizzes']);
    }
  }
}

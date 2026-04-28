import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_card_id: string | null;
  country: string;
  city: string | null;
  preferences: { allowExchangeRequests: boolean };
  quizzes_completed: number;
  market_deals_completed: number;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient;

  private _user$ = new BehaviorSubject<User | null>(null);
  readonly user$ = this._user$.asObservable();

  private _isAdmin$ = new BehaviorSubject<boolean>(false);
  readonly isAdmin$ = this._isAdmin$.asObservable();

  constructor() {
    this.client = createClient(environment.supabase.url, environment.supabase.anonKey);

    this.client.auth.getSession().then(({ data }) => {
      this._user$.next(data.session?.user ?? null);
      this.refreshAdminStatus(data.session?.user?.id);
    });

    this.client.auth.onAuthStateChange((_event, session) => {
      this._user$.next(session?.user ?? null);
      this.refreshAdminStatus(session?.user?.id);
    });
  }

  private async refreshAdminStatus(userId: string | undefined) {
    if (!userId) { this._isAdmin$.next(false); return; }
    this._isAdmin$.next(await this.isAdmin(userId));
  }

  get currentUser(): User | null {
    return this._user$.getValue();
  }

  async getSession() {
    return this.client.auth.getSession();
  }

  async signUp(email: string, password: string, meta: { username: string; display_name: string; country: string }) {
    return this.client.auth.signUp({ email, password, options: { data: meta } });
  }

  async signIn(email: string, password: string) {
    return this.client.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    return this.client.auth.signOut();
  }

  async updatePassword(newPassword: string) {
    return this.client.auth.updateUser({ password: newPassword });
  }

  async getProfile(userId: string) {
    return this.client.from('profiles').select('*').eq('id', userId).single<Profile>();
  }

  async updateProfile(userId: string, updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>) {
    return this.client.from('profiles').update(updates).eq('id', userId);
  }

  async getUserCardIds(userId: string): Promise<string[]> {
    const { data } = await this.client
      .from('user_cards')
      .select('card_id')
      .eq('user_id', userId);
    return data?.map((r: any) => r.card_id) ?? [];
  }

  async addUserCard(userId: string, cardId: string) {
    return this.client.from('user_cards').insert({ user_id: userId, card_id: cardId });
  }

  async removeUserCard(userId: string, cardId: string) {
    return this.client.from('user_cards').delete().eq('user_id', userId).eq('card_id', cardId);
  }

  async isAdmin(userId: string): Promise<boolean> {
    const { data } = await this.client
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    return data?.is_admin === true;
  }
}

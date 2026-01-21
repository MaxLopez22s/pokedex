import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PokeapiService {
  private baseUrl = 'https://pokeapi.co/api/v2';

  constructor(private http: HttpClient) {}

  getPokemons(limit = 151) {
    return this.http
      .get<any>(`${this.baseUrl}/pokemon?limit=${limit}`)
      .pipe(map(res => res.results));
  }

  getPokemonByUrl(url: string) {
    return this.http.get<any>(url);
  }

  getTypes() {
    return this.http.get<any>(`${this.baseUrl}/type`);
  }

  getPokemonsByType(type: string) {
    return this.http.get<any>(`${this.baseUrl}/type/${type}`);
  }
}

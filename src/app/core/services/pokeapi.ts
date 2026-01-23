import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Pokemon, PokemonListItem, PokemonTypeResponse } from '../models/pokemon.interface';

interface PokemonListResponse {
  results: PokemonListItem[];
  count: number;
}

interface TypesResponse {
  results: Array<{ name: string; url: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class PokeapiService {
  private baseUrl = 'https://pokeapi.co/api/v2';

  constructor(private http: HttpClient) {}

  getPokemons(limit?: number): Observable<PokemonListItem[]> {
    const url = limit 
      ? `${this.baseUrl}/pokemon?limit=${limit}`
      : `${this.baseUrl}/pokemon?limit=10000`;
    return this.http
      .get<PokemonListResponse>(url)
      .pipe(map(res => res.results));
  }

  /** Obtiene una página de la lista (para cargar solo la primera por defecto). */
  getPokemonsPage(limit: number, offset: number): Observable<{ results: PokemonListItem[]; count: number }> {
    const url = `${this.baseUrl}/pokemon?limit=${limit}&offset=${offset}`;
    return this.http.get<PokemonListResponse>(url).pipe(
      map(res => ({ results: res.results, count: res.count }))
    );
  }

  getPokemonByUrl(url: string): Observable<Pokemon> {
    return this.http.get<Pokemon>(url);
  }

  getTypes(): Observable<TypesResponse> {
    return this.http.get<TypesResponse>(`${this.baseUrl}/type`);
  }

  getPokemonsByType(type: string): Observable<PokemonTypeResponse> {
    return this.http.get<PokemonTypeResponse>(`${this.baseUrl}/type/${type}`);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokeapiService } from '../../core/services/pokeapi';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pokedex',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './pokedex.html',
  styleUrl: './pokedex.scss',
})
export class PokedexComponent implements OnInit {
  pokemons: any[] = [];
  allPokemons: any[] = [];
  loading = false;

  searchTerm = '';
  suggestions: any[] = [];
  showSuggestions = false;

  showGrid = true;
  showSidebar = false;

  constructor(private pokeApi: PokeapiService) {}

  ngOnInit() {
    this.loadAllPokemons();
  }

  loadAllPokemons() {
  this.loading = true;

  this.pokeApi.getPokemons().subscribe((list: any[]) => {
    const requests = list.map(p =>
      this.pokeApi.getPokemonByUrl(p.url)
    );

    forkJoin<any[]>(requests).subscribe(data => {
      this.allPokemons = data;
      this.pokemons = data;
      this.loading = false;
    });
  });
}


  filterByType(type: string) {
    if (type === 'all') {
      this.loadAllPokemons();
      return;
    }

    this.loading = true;

    this.pokeApi.getPokemonsByType(type).subscribe(res => {
      const requests = res.pokemon.map((p: any) =>
        this.pokeApi.getPokemonByUrl(p.pokemon.url)
      );

      forkJoin<any[]>(requests).subscribe(data => {
        this.pokemons = data;
        this.loading = false;
      });
    });
  }

  searchPokemon() {
    const value = this.searchTerm.toLowerCase().trim();

    if (!value) {
      this.pokemons = this.allPokemons;
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }
    
    this.pokemons = this.allPokemons.filter(pokemon =>
      pokemon.name.includes(value) ||
      pokemon.id.toString() === value
    );

    this.suggestions = [];
    this.showSuggestions = false;
  }

  updateSuggestions() {
    const value = this.searchTerm.toLowerCase().trim();

    if (value.length < 2) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }

    this.suggestions = this.allPokemons.filter(pokemon =>
      pokemon.name.includes(value)
    ).slice(0, 5);

    this.showSuggestions = this.suggestions.length > 0;
  }

  selectSuggestion(pokemon: any) {
    this.searchTerm = pokemon.name;
    this.pokemons = [pokemon];
    this.suggestions = [];
    this.showSuggestions = false;
  }
}

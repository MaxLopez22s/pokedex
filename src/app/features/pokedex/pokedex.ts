import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PokeapiService } from '../../core/services/pokeapi';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
import { forkJoin, catchError, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Pokemon, PokemonListItem } from '../../core/models/pokemon.interface';

@Component({
  selector: 'app-pokedex',
  standalone: true,
  imports: [CommonModule, SidebarComponent, FormsModule],
  templateUrl: './pokedex.html',
  styleUrl: './pokedex.scss',
})
export class PokedexComponent implements OnInit {
  pokemons: Pokemon[] = [];
  allPokemons: Pokemon[] = [];
  loading = false;

  searchTerm = '';
  suggestions: Pokemon[] = [];
  showSuggestions = false;

  showGrid = true;
  showSidebar = false;

  // Paginación
  currentPage = 1;
  itemsPerPage = 20;
  paginatedPokemons: Pokemon[] = [];
  totalPages = 1;
  totalCount = 0; // Total desde API (modo "Todos")
  filterMode: 'all' | string = 'all'; // 'all' = paginar por API; tipo = filtrar en memoria

  // Modal de detalles
  selectedPokemon: Pokemon | null = null;
  showModal = false;

  constructor(
    private pokeApi: PokeapiService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Usar setTimeout para asegurar que se ejecute después de la inicialización completa
      setTimeout(() => {
        this.loadPage(1);
      }, 0);
    } else {
      this.loading = false;
    }
  }

  /** Carga una página desde la API (solo primera por defecto). */
  loadPage(page: number) {
    if (!isPlatformBrowser(this.platformId)) return;
    
    this.ngZone.run(() => {
      this.loading = true;
      this.currentPage = page;
      this.cdr.markForCheck();
    });

    const offset = (page - 1) * this.itemsPerPage;
    this.pokeApi.getPokemonsPage(this.itemsPerPage, offset).subscribe({
      next: ({ results, count }) => {
        this.ngZone.run(() => {
          this.totalCount = count;
          this.totalPages = Math.ceil(count / this.itemsPerPage);
        });
        
        const requests = results.map(p =>
          this.pokeApi.getPokemonByUrl(p.url).pipe(
            catchError(err => {
              console.warn(`Error al cargar Pokémon ${p.name}:`, err);
              return of(null);
            })
          )
        );
        
        forkJoin(requests).subscribe({
          next: (data) => {
            this.ngZone.run(() => {
              const valid = data.filter((p): p is Pokemon => p !== null);
              valid.sort((a, b) => a.id - b.id);
              this.pokemons = valid;
              this.paginatedPokemons = valid;
              this.loading = false;
              this.cdr.markForCheck();
            });
          },
          error: (err) => {
            console.error('Error al cargar detalles:', err);
            this.ngZone.run(() => {
              this.loading = false;
              this.cdr.markForCheck();
            });
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener página:', err);
        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.markForCheck();
        });
      }
    });
  }


  filterByType(type: string) {
    if (type === 'all') {
      this.filterMode = 'all';
      this.loadPage(1);
      return;
    }

    this.filterMode = type;
    // Filtrado instantáneo si ya tenemos datos de ese tipo en memoria
    if (this.allPokemons.length > 0) {
      const filtered = this.allPokemons.filter(pokemon =>
        pokemon.types.some(t => t.type.name === type)
      );
      if (filtered.length > 0) {
        this.pokemons = filtered;
        this.currentPage = 1;
        this.updatePagination();
        return;
      }
    }

    this.loading = true;
    this.pokeApi.getPokemonsByType(type).subscribe({
      next: (res) => {
        const requests = res.pokemon.map(p =>
          this.pokeApi.getPokemonByUrl(p.pokemon.url).pipe(
            catchError(error => {
              console.warn(`Error al cargar Pokémon ${p.pokemon.name}:`, error);
              return of(null);
            })
          )
        );

        forkJoin(requests).subscribe({
          next: (data) => {
            const validPokemons = data.filter((pokemon): pokemon is Pokemon => pokemon !== null);
            validPokemons.sort((a, b) => a.id - b.id);
            this.allPokemons = validPokemons;
            this.pokemons = validPokemons;
            this.currentPage = 1;
            this.updatePagination();
            this.loading = false;
            this.ngZone.run(() => this.cdr.detectChanges());
          },
          error: (error) => {
            console.error('Error al cargar Pokémon por tipo:', error);
            this.loading = false;
            this.ngZone.run(() => this.cdr.detectChanges());
          }
        });
      },
      error: (error) => {
        console.error('Error al obtener Pokémon por tipo:', error);
        this.loading = false;
        this.ngZone.run(() => this.cdr.detectChanges());
      }
    });
  }

  searchPokemon() {
    const value = this.searchTerm.toLowerCase().trim();

    if (!value) {
      if (this.filterMode === 'all') {
        this.loadPage(1);
      } else {
        this.pokemons = this.allPokemons;
        this.currentPage = 1;
        this.updatePagination();
      }
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }

    const source = this.filterMode === 'all' ? this.pokemons : this.allPokemons;
    this.pokemons = source.filter(pokemon =>
      pokemon.name.includes(value) || pokemon.id.toString() === value
    );
    this.currentPage = 1;
    this.updatePagination();
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
    const source = this.filterMode === 'all' ? this.pokemons : this.allPokemons;
    this.suggestions = source
      .filter(pokemon => pokemon.name.includes(value))
      .slice(0, 5);
    this.showSuggestions = this.suggestions.length > 0;
  }

  selectSuggestion(pokemon: Pokemon) {
    this.searchTerm = pokemon.name;
    this.pokemons = [pokemon];
    this.currentPage = 1;
    this.updatePagination();
    this.suggestions = [];
    this.showSuggestions = false;
  }

  /** true = paginar por API (Todos, sin búsqueda). */
  private isPaginatingByApi(): boolean {
    return this.filterMode === 'all' && !this.searchTerm.trim();
  }

  updatePagination() {
    if (this.isPaginatingByApi()) {
      this.totalPages = Math.ceil(this.totalCount / this.itemsPerPage);
      this.paginatedPokemons = this.pokemons;
    } else {
      this.totalPages = Math.max(1, Math.ceil(this.pokemons.length / this.itemsPerPage));
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      this.paginatedPokemons = this.pokemons.slice(start, end);
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    if (this.isPaginatingByApi()) {
      this.loadPage(page);
    } else {
      this.currentPage = page;
      this.updatePagination();
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getPageRange(): string {
    if (this.paginatedPokemons.length === 0) {
      return '0 - 0';
    }
    const startId = this.paginatedPokemons[0].id;
    const endId = this.paginatedPokemons[this.paginatedPokemons.length - 1].id;
    return `#${this.getPokemonId(this.paginatedPokemons[0])} - #${this.getPokemonId(this.paginatedPokemons[this.paginatedPokemons.length - 1])}`;
  }

  getPageInfo(): string {
    const total = this.isPaginatingByApi() ? this.totalCount : this.pokemons.length;
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, total);
    return `${start} - ${end} de ${total}`;
  }

  /** Volver a "Todos" y cargar primera página (para no-results). */
  resetToAll() {
    this.searchTerm = '';
    this.filterMode = 'all';
    this.loadPage(1);
    this.suggestions = [];
    this.showSuggestions = false;
  }

  onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.searchPokemon();
      this.showSuggestions = false;
    }
  }

  getTypeColor(typeName: string): string {
    const typeColors: { [key: string]: string } = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC',
      unknown: '#68A090',
      shadow: '#705898'
    };
    return typeColors[typeName.toLowerCase()] || '#68A090';
  }

  getPokemonId(pokemon: Pokemon): string {
    return pokemon.id.toString().padStart(3, '0');
  }

  openPokemonDetail(pokemon: Pokemon) {
    this.selectedPokemon = pokemon;
    this.showModal = true;
    // Prevenir scroll del body cuando el modal está abierto
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  closePokemonDetail() {
    this.showModal = false;
    this.selectedPokemon = null;
    // Restaurar scroll del body
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  getStatName(statName: string): string {
    const statNames: { [key: string]: string } = {
      'hp': 'HP',
      'attack': 'Ataque',
      'defense': 'Defensa',
      'special-attack': 'Ataque Especial',
      'special-defense': 'Defensa Especial',
      'speed': 'Velocidad'
    };
    return statNames[statName] || statName;
  }

  getFirstTypeName(pokemon: Pokemon): string {
    if (!pokemon.types || pokemon.types.length === 0) {
      return 'normal';
    }
    return pokemon.types[0]?.type?.name || 'normal';
  }

  getModalGradient(pokemon: Pokemon): string {
    if (!pokemon.types || pokemon.types.length === 0) {
      return 'linear-gradient(135deg, #68A090 0%, #68A090 100%)';
    }
    const firstType = pokemon.types[0]?.type?.name || 'normal';
    const lastType = pokemon.types.length > 1 
      ? (pokemon.types[pokemon.types.length - 1]?.type?.name || firstType)
      : firstType;
    return `linear-gradient(135deg, ${this.getTypeColor(firstType)} 0%, ${this.getTypeColor(lastType)} 100%)`;
  }

  /** Obtiene la URL del sprite. Si front_default es null (mega, etc.), usa official-artwork o placeholder. */
  getSpriteUrl(pokemon: Pokemon): string {
    const s = pokemon?.sprites;
    if (!s) return this.placeholderSpriteUrl;

    const url =
      (s.front_default && s.front_default.trim()) ||
      (s.other?.['official-artwork']?.front_default && s.other['official-artwork'].front_default.trim()) ||
      (s.other?.['dream_world']?.front_default && s.other['dream_world'].front_default.trim()) ||
      (s.front_shiny && s.front_shiny.trim());

    return url || this.placeholderSpriteUrl;
  }

  /** Placeholder cuando la API no devuelve sprite (ej. Scrafty-mega, otras formas). */
  private readonly placeholderSpriteUrl =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect fill='%23f0f0f0' width='96' height='96' rx='8'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='32' font-family='sans-serif'%3E?%3C/text%3E%3C/svg%3E";

  /** Fallback si la URL del sprite falla al cargar (404, etc.). */
  onSpriteError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) img.src = this.placeholderSpriteUrl;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokeapiService } from '../../core/services/pokeapi';
import { SidebarComponent } from '../../shared/sidebar/sidebar';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-pokedex',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './pokedex.html',
  styleUrl: './pokedex.scss',
})
export class PokedexComponent implements OnInit {
  pokemons: any[] = [];
  loading = false;

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
}

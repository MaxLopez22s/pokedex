import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokeapiService } from '../../core/services/pokeapi';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule], // 👈 ESTO ES CLAVE
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  host: {
    '[class.open]': 'isOpen'
  }
})
export class SidebarComponent implements OnInit {
  types: any[] = [];

  @Input() isOpen = false;
  @Output() typeSelected = new EventEmitter<string>();

  constructor(private pokeApi: PokeapiService) {}

  ngOnInit() {
    this.pokeApi.getTypes().subscribe(res => {
      // Filtrar tipos que no tienen Pokémon (stellar, unknown)
      this.types = res.results.filter(type => 
        type.name !== 'stellar' && type.name !== 'unknown'
      );
    });
  }

  selectType(type: string) {
    this.typeSelected.emit(type);
  }
}

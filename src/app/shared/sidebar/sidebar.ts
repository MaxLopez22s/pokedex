import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokeapiService } from '../../core/services/pokeapi';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule], // 👈 ESTO ES CLAVE
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class SidebarComponent implements OnInit {
  types: any[] = [];

  @Output() typeSelected = new EventEmitter<string>();

  constructor(private pokeApi: PokeapiService) {}

  ngOnInit() {
    this.pokeApi.getTypes().subscribe(res => {
      this.types = res.results;
    });
  }

  selectType(type: string) {
    this.typeSelected.emit(type);
  }
}

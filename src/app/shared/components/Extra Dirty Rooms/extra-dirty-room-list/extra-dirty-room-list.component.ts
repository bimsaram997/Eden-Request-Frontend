import { Component, OnDestroy, OnInit } from '@angular/core';
import { MATERIAL_COMPONENTS } from '../../../utils/material-imports';
import { Router } from '@angular/router';

@Component({
  selector: 'app-extra-dirty-room-list',
  standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './extra-dirty-room-list.component.html',
  styleUrl: './extra-dirty-room-list.component.css'
})
export class ExtraDirtyRoomListComponent implements OnInit, OnDestroy {
  private subs: any[] = [];
  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
   
   
  }



routeToExtraDirtyRoom() {
throw new Error('Method not implemented.');
}

  ngOnDestroy(): void {
    this.subs.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
  }

}

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
  session: any;
  isTeamLeaderUser!: boolean;

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
    this.session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeaderUser = (this.session.role || this.session.userRole) === 'TeamLeader';

  }



  routeToExtraDirtyRoom() {
    this.router.navigate(['/workspace/extra-dirty-room-form']);
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
  }

}

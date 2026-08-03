import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MATERIAL_COMPONENTS } from '../../../shared/utils/material-imports';


@Component({
  selector: 'app-sidenavbar',
   standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './sidenavbar.component.html',
  styleUrls: ['./sidenavbar.component.css']
})
export class SidenavbarComponent {
  @Output() sidenavClose = new EventEmitter();
  imagePath: string = 'assets/main images/bread-food-meal-bun.jpg';
// Updated menu array to hold the child routing targets
  menuArray: any[] = [
    { name: 'Requests', routePath: 'requests-list', visible: true },
    { name: 'Extra Work Requests', routePath: 'extra-work-requests', visible: true },
    { name: 'Extra Dirty Rooms', routePath: 'extra-dirty-rooms', visible: true },
  ];
  isShow: boolean =  false;
  isTeamLeaderUser!: boolean;
  
  constructor(private router: Router) { }

  ngOnInit(): void {
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeaderUser = (session.role || session.userRole) === 'TeamLeader';
  }

  onMenuClick(menu: any): void {
    this.navigateTo(menu.routePath);
    if (window.innerWidth < 768) {
      this.sidenavClose.emit();
    }
  }

  onSidenavClose() {
    this.sidenavClose.emit();
  }

  

 navigateTo(path: string): void {
    if (path) {
      this.router.navigate([`/workspace/${path}`]);
    }
  }

}

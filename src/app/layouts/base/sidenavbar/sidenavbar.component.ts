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
    { name: 'Requests', routePath: 'requests-list', visible: true }
  ];
  isShow: boolean =  false;
  isTeamLeaderUser!: boolean;
  
  constructor(private router: Router) { }

  ngOnInit(): void {
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeaderUser = (session.role || session.userRole) === 'TeamLeader';
  }

  onMenuClick(menu: any): void {
    // 1. Call your navigation logic
    this.navigateTo(menu.routePath);

    // 2. If screen width is less than 768px (Bootstrap's 'md' breakpoint),
    // automatically notify the parent layout to close the mobile drawer.
    if (window.innerWidth < 768) {
      this.sidenavClose.emit();
    }
  }

  onSidenavClose() {
    this.sidenavClose.emit();
  }

  

 navigateTo(path: string): void {
    if (path) {
      // Navigates to absolute context route: /workspace/request-list
      this.router.navigate([`/workspace/${path}`]);
    }
  }

}

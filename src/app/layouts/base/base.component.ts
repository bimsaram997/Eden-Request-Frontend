import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { NavbarComponent } from "./navbar/navbar.component";
import { SidenavbarComponent } from './sidenavbar/sidenavbar.component';
import { MATERIAL_COMPONENTS } from '../../shared/utils/material-imports';

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidenavbarComponent, MATERIAL_COMPONENTS],
  templateUrl: './base.component.html',
  styleUrl: './base.component.css'
})
export class BaseComponent {
isTeamLeaderUser: boolean = false;
  public isSidenavOpen = false;

  // Grab the sidebar elements out of the layout template dynamically
  @ViewChild('sidebarDesktop', { static: false }) sidebarDesktop!: ElementRef;
  @ViewChild('sidebarMobile', { static: false }) sidebarMobile!: ElementRef;

  ngOnInit(): void {
    const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.isTeamLeaderUser = (session.role || session.userRole) === 'TeamLeader';
  }

  toggleSidenav(): void {
    this.isSidenavOpen = !this.isSidenavOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // If the sidebar is already shut, ignore clicks completely
    if (!this.isSidenavOpen) {
      return;
    }

    const clickedElement = event.target as HTMLElement;

    // Check if the click landing pad falls within the panels
    const clickedInsideDesktop = this.sidebarDesktop?.nativeElement?.contains(clickedElement);
    const clickedInsideMobile = this.sidebarMobile?.nativeElement?.contains(clickedElement);

    // Identify navbar elements/triggers to make sure toggle buttons don't cross-cancel
    const clickedNavbarToggle = clickedElement.closest('.navbar-toggler') || 
                                 clickedElement.closest('.bi-list') ||
                                 clickedElement.closest('app-navbar');

    // If the user clicked outside the side bars, and didn't touch the toggle trigger, close it!
    if (!clickedInsideDesktop && !clickedInsideMobile && !clickedNavbarToggle) {
      this.isSidenavOpen = false;
    }
  }

}

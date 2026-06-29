import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MATERIAL_COMPONENTS } from '../../../shared/utils/material-imports';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterOutlet, MATERIAL_COMPONENTS],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit{
@Output() public sidenavToggle = new EventEmitter();

constructor(private router: Router,) { }

ngOnInit(): void {
  }
  onToogleSlidenav() {
    this.sidenavToggle.emit();
  }

  public logOut(): void {
    localStorage.removeItem('scandic_eden_session');
    this.router.navigate(['']);
  }
}

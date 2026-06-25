import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MATERIAL_COMPONENTS } from '../../../shared/utils/material-imports';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterOutlet, MATERIAL_COMPONENTS],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

}

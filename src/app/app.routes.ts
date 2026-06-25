import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./shared/components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'workspace',
    loadComponent: () => import('./layouts/base/base.component').then(m => m.BaseComponent),
    children: [
      { path: '', redirectTo: 'housekeeper-dashboard', pathMatch: 'full' },
      
      // 🧹 Housekeeper Landing Dashboard (Lists past items)
      {
        path: 'housekeeper-dashboard',
        loadComponent: () => import('./modules/housekeeping/housekeeping-dashbaord/housekeeping-dashbaord.component').then(m => m.HousekeepingDashbaordComponent)
      },
       {
      path: 'request-form',
      loadComponent: () =>
        import('./modules/housekeeping/housekeeping-dashbaord/components/request-form/request-form.component')
          .then(m => m.RequestFormComponent)
    }

      // 📝 Housekeeper Full Form Page (Opened by clicking the "Add New" button)
     
      
      // 📋 Team Leader Control Panel Dashboard (Disabled for now)
      // {
      //   path: 'leader-dashboard',
      //   loadComponent: () => import('./modules/team-leader/live-dashboard/live-dashboard.component').then(m => m.LiveDashboardComponent)
      // }
    ]
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
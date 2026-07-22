import { Component, OnDestroy, OnInit } from '@angular/core';
import { RequestListComponent } from "./components/request-list/request-list.component";
import { Router } from '@angular/router';
import { MATERIAL_COMPONENTS } from '../../../shared/utils/material-imports';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotificationServiceService } from '../../../services/notification-service.service';
import { Subscription } from 'rxjs';
import { PushNotificationService } from '../../../services/push-notification.service';
import { EmployeeDto } from '../../../models/employee';
import { AuthService } from '../../../services/auth.service';
import { ReportsService } from '../../../services/reports.service';
import { HousekeeperReportDto } from '../../../models/report';
import Chart from 'chart.js/auto';
@Component({
  selector: 'app-housekeeping-dashbaord',
  standalone: true,
  imports: [RequestListComponent, MATERIAL_COMPONENTS],
  templateUrl: './housekeeping-dashbaord.component.html',
  styleUrl: './housekeeping-dashbaord.component.css'
})
export class HousekeepingDashbaordComponent implements OnInit, OnDestroy   {
  private activeSubscriptions: any[] = [];
  session: any;

  employeeDetails: EmployeeDto = {
    id: 0,
    name: 'Loading...',
    email: 'HK',
    role: 'Housekeeper',

  };

  isLoading = true;
  reportData: any = null;
  chart: any;

  constructor(private router: Router,
  
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private reportsService: ReportsService,
  ) { }


  routeToRequest() {
    this.router.navigate(['/workspace/request-form']);
  }


  ngOnInit(): void {
   const session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.employeeDetails.id = session.id || session.employeeId || 1;
    if (this.employeeDetails.id) {
      this.loadEmpoyeeDetails();
    }
    
  }

  loadEmpoyeeDetails() {
    this.isLoading = true; 
    this.activeSubscriptions.push(this.authService.getEmployeeGenericDataById(this.employeeDetails.id).subscribe({
      next: (data: EmployeeDto) => {
        this.employeeDetails = data;  
        if (this.employeeDetails) {
          this.fetchReportData();
        }
      },
      error: (error: any) => {
        console.error('Error fetching employee details:', error);
        this.snackBar.open('Failed to load employee details.', 'Close', { duration: 3000 });
      },
      complete: () => {
        this.isLoading = false;
      }
    }));
    
  }

  fetchReportData() {
    this.activeSubscriptions.push(this.reportsService.getReportsByHouseKeeperId(this.employeeDetails.id).subscribe({
      next: (data: HousekeeperReportDto) => {
        this.reportData = data;
        this.isLoading = false;

        setTimeout(() => this.renderChart(), 100);
      },
      error: (error: any) => {
        console.error('Error fetching report data:', error);
        this.snackBar.open('Failed to load report data.', 'Close', { duration: 3000 });
      }
    }));
  }

  renderChart(): void {
    const canvas = document.getElementById('weeklyTrendChart') as HTMLCanvasElement;
    if (!canvas || !this.reportData?.weeklyTrend) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const labels = this.reportData.weeklyTrend.map((item: any) => item.dayName);
    const extraWorkData = this.reportData.weeklyTrend.map((item: any) => item.extraWorkCompleted);
    const suppliesData = this.reportData.weeklyTrend.map((item: any) => item.suppliesRequested);

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Extra Work Completed',
            data: extraWorkData,
            backgroundColor: '#0d6efd',
            borderRadius: 6
          },
          {
            label: 'Supplies Requested',
            data: suppliesData,
            backgroundColor: '#0dcaf0',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 }
          }
        }
      }
    });
  }

 
 ngOnDestroy(): void {
    // 🟢 4. FIX: Safely loop and unsubscribe individually without throwing errors
    this.activeSubscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });
    if (this.chart) {
      this.chart.destroy();
    }
  }
}

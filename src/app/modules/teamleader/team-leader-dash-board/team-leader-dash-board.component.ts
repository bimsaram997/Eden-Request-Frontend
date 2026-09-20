import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReportsService } from '../../../services/reports.service';
import Chart from 'chart.js/auto';
import { MATERIAL_COMPONENTS } from '../../../shared/utils/material-imports';

@Component({
  selector: 'app-team-leader-dash-board',
  standalone: true,
  imports: [MATERIAL_COMPONENTS],
  templateUrl: './team-leader-dash-board.component.html',
  styleUrl: './team-leader-dash-board.component.css'
})
export class TeamLeaderDashBoardComponent implements OnInit, OnDestroy {
  private activeSubscriptions: any[] = [];
  session: any;
  isLoading = true;
  reportData: any = null;
  staffChart: any;
  itemsChart: any;

  constructor(private http: HttpClient,
    private reportsService: ReportsService,
  ) { }

  ngOnInit(): void {
    this.session = JSON.parse(localStorage.getItem('scandic_eden_session') || '{}');
    this.fetchReportData();
  }

  fetchReportData(): void {
    this.isLoading = true;
    this.reportsService.getReportsByTeamLeader().subscribe({
      next: (data) => {
        this.reportData = data;
        this.isLoading = false;
        
        setTimeout(() => this.renderCharts(), 50);
      },
      error: (err) => {
        console.error('Error fetching team leader report:', err);
        this.isLoading = false;
      }
    });
  }

  renderCharts(): void {
    this.renderStaffChart();
    this.renderItemsChart();
  }

  private renderStaffChart(): void {
    const canvas = document.getElementById('staffChart') as HTMLCanvasElement;
    if (!canvas || !this.reportData?.staffPerformance) return;
    if (this.staffChart) this.staffChart.destroy();
    const labels = this.reportData.staffPerformance.map((s: any) => s.housekeeperName);
    const data = this.reportData.staffPerformance.map((s: any) => s.completedExtraWork);

    this.staffChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Completed Extra works',
          data: data,
          backgroundColor: '#0d6efd',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  private renderItemsChart(): void {
    const canvas = document.getElementById('itemsChart') as HTMLCanvasElement;
    if (!canvas || !this.reportData?.topItems) return;
    if (this.itemsChart) this.itemsChart.destroy();
    const labels = this.reportData.topItems.map((i: any) => i.itemName);
    const data = this.reportData.topItems.map((i: any) => i.totalQuantity);
    this.itemsChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#0d6efd', '#0dcaf0', '#198754', '#ffc107', '#dc3545']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }


  ngOnDestroy(): void {
    if (this.staffChart) this.staffChart.destroy();
    if (this.itemsChart) this.itemsChart.destroy();
    this.activeSubscriptions.forEach(sub => {
      if (sub && typeof sub.unsubscribe === 'function') {
        sub.unsubscribe();
      }
    });

  }
}

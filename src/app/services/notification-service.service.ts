import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, Subject, HttpTransportType } from '@microsoft/signalr';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class NotificationServiceService {
  myUrl = environment.baseUrl;
  private hubConnection!: HubConnection;
  
  // Real-time reactive data pipelines
  public leaderNewRequests$ = new Subject<any>(); 
  public housekeeperStatusUpdates$ = new Subject<any>();
  // 🟢 NEW: Add pipeline for Extra Work Requests
  public housekeeperNewExtraWork$ = new Subject<any>(); 
    public leaderExtraWorkStatusUpdates$ = new Subject<any>(); 
  
  private alertSound = new Audio('notification-alert.mp3');

  constructor() { }

  public startConnection(userEmail: string, userRole: string): void {
    // 🚀 DYNAMIC URL FIX: Auto-calculates base address from environment setup
    const hubUrl = `${environment.baseUrl.replace('/api', '')}/notificationHub`;

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: false,
        transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling
      }) 
      .withAutomaticReconnect()
      .build();

    // 🟢 CRITICAL FIX: Register listeners BEFORE calling .start() so no events are missed
    this.registerHubListeners();

    // Establish initial connection sequence
    this.hubConnection
      .start()
      .then(() => {
        console.log(`SignalR connection active for: ${userEmail} via ${hubUrl}`);
        this.hubConnection.invoke('JoinUserByRole', userEmail, userRole);
      })
      .catch(err => console.error('SignalR Startup Error:', err));

    // Auto-re-register user info if the browser drops connection and recovers!
    this.hubConnection.onreconnected((connectionId) => {
      console.log(`SignalR reconnected successfully. Re-syncing status for ${userEmail}...`);
      this.hubConnection.invoke('JoinUserByRole', userEmail, userRole);
    });
  }

  private registerHubListeners(): void {
    // Listen for Standard Requests (Team Leader side)
    this.hubConnection.on('ReceiveNewRequestAlert', (data) => {
      this.leaderNewRequests$.next(data);
      this.triggerDeviceAlert();
    });

    // Listen for standard updates (Housekeeper side)
    this.hubConnection.on('ReceiveStatusUpdate', (data) => {
      this.housekeeperStatusUpdates$.next(data);
      this.triggerDeviceAlert();
    });

    // 🟢 NEW: Listen for extra work notifications coming from your ExtraWorkRequestsController
    this.hubConnection.on('ReceiveNewExtraWorkAlert', (data) => {
      console.log('Real-time extra work received:', data);
      this.housekeeperNewExtraWork$.next(data);
      this.triggerDeviceAlert();
    });

    this.hubConnection.on('ReceiveExtraWorkStatusUpdateForLeader', (data) => {
    console.log('Leader received real-time extra work status adjustment:', data);
    this.leaderExtraWorkStatusUpdates$.next(data);
    this.triggerDeviceAlert();
  });
  }

  private triggerDeviceAlert(): void {
    this.alertSound.currentTime = 0;
    this.alertSound.play()
      .then(() => console.log('Notification alert sound played successfully.'))
      .catch((err) => console.warn('Audio autoplay blocked.'));

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([400, 150, 400]);
      } catch (err) {
        console.warn('Vibration blocked.', err);
      }
    }
  }

  public stopConnection(userEmail: string): void {
    if (!this.hubConnection) return;

    this.hubConnection.invoke('LeaveUser', userEmail)
      .then(() => {
        console.log(`Manually unregistered active status for: ${userEmail}`);
        return this.hubConnection.stop();
      })
      .then(() => console.log('SignalR connection cleanly stopped.'))
      .catch(err => console.error('Error during SignalR disconnect sequence:', err));
  }
}
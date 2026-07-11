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

    // 1. Establish initial connection sequence
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

    // 2. Register Active Channel Event Listeners
    this.hubConnection.on('ReceiveNewRequestAlert', (data) => {
      this.leaderNewRequests$.next(data);
      this.triggerDeviceAlert();
    });

    this.hubConnection.on('ReceiveStatusUpdate', (data) => {
      this.housekeeperStatusUpdates$.next(data);
      this.triggerDeviceAlert();
    });
  }

  private triggerDeviceAlert(): void {
    // Reset and play sound safely
    this.alertSound.currentTime = 0;
    this.alertSound.play()
      .then(() => {
        console.log('Notification alert sound played successfully.');
      })
      .catch((err) => {
        console.warn('Audio autoplay blocked. User needs to interact with the page first.');
      });

    // Trigger vibration safely
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([400, 150, 400]);
      } catch (err) {
        console.warn('Vibration blocked. User needs to interact with the page first.', err);
      }
    }
  }

  public stopConnection(userEmail: string): void {
    if (!this.hubConnection) return;

    // 1. Tell the backend to drop this email from the active tracking map right now
    this.hubConnection.invoke('LeaveUser', userEmail)
      .then(() => {
        console.log(`Manually unregistered active status for: ${userEmail}`);
        
        // 2. Gracefully kill the physical network connection
        return this.hubConnection.stop();
      })
      .then(() => {
        console.log('SignalR connection cleanly stopped.');
      })
      .catch(err => console.error('Error during SignalR disconnect sequence:', err));
  }
}
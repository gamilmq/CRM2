import { CallState, SipConfig, ActiveCall } from '../types';

type CallStateChangeListener = (state: CallState) => void;
type ActiveCallsListener = (calls: ActiveCall[]) => void;

class SipService {
  private state: CallState = CallState.IDLE;
  private listeners: CallStateChangeListener[] = [];
  private activeCallsListeners: ActiveCallsListener[] = [];
  private config: SipConfig | null = null;
  private activeNumber: string | null = null;
  private activeStartTime: number | null = null;
  
  // User specific credentials
  private extension: string | null = null;
  private password: string | null = null;
  
  // Simulated other agents calls
  private simulatedCalls: ActiveCall[] = [];
  private simulationInterval: number | null = null;

  constructor() {
    this.startSimulation();
  }

  public register(config: SipConfig, extension?: string, password?: string) {
    this.config = config;
    this.extension = extension || null;
    this.password = password || null;
    
    console.log("SIP User Agent Registered:", {
        server: config.server,
        extension: this.extension,
        hasPassword: !!this.password
    });
  }

  public subscribe(listener: CallStateChangeListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public subscribeActiveCalls(listener: ActiveCallsListener) {
      this.activeCallsListeners.push(listener);
      // Send initial state
      listener(this.getCombinedActiveCalls());
      return () => {
          this.activeCallsListeners = this.activeCallsListeners.filter(l => l !== listener);
      };
  }

  private setState(newState: CallState) {
    this.state = newState;
    this.listeners.forEach(listener => listener(newState));
    this.broadcastActiveCalls();
  }

  public async makeCall(number: string) {
    if (this.state !== CallState.IDLE) return;
    if (!this.extension) {
        console.error("Cannot make call: No SIP Extension registered for this user.");
        alert("Call Failed: SIP Extension not configured for this agent.");
        return;
    }
    
    this.activeNumber = number;
    console.log(`Dialing ${number} from ${this.extension} via ${this.config?.server}...`);
    
    this.setState(CallState.CONNECTING);

    // Simulate connection delay
    setTimeout(() => {
        if(this.state === CallState.CONNECTING) {
            this.setState(CallState.RINGING);
            
            // Simulate pickup
            setTimeout(() => {
                if(this.state === CallState.RINGING) {
                    this.activeStartTime = Date.now();
                    this.setState(CallState.CONNECTED);
                }
            }, 2500);
        }
    }, 1000);
  }

  public hangup() {
    if (this.state === CallState.IDLE) return;
    console.log("Hanging up...");
    this.setState(CallState.ENDING);
    setTimeout(() => {
        this.setState(CallState.IDLE);
        this.activeNumber = null;
        this.activeStartTime = null;
    }, 500);
  }

  public answer() {
      if (this.state === CallState.RINGING) {
          this.activeStartTime = Date.now();
          this.setState(CallState.CONNECTED);
      }
  }
  
  public getActiveNumber() {
      return this.activeNumber;
  }

  // --- Monitoring Simulation (Kept for visual demo of 'other agents') ---

  private startSimulation() {
      // Simulate random calls from other agents starting and stopping
      this.simulationInterval = window.setInterval(() => {
          // 30% chance to start a new call if less than 5 calls
          if (this.simulatedCalls.length < 5 && Math.random() > 0.7) {
              this.simulatedCalls.push({
                  id: Math.random().toString(36).substr(2, 9),
                  agentName: `Agent ${Math.floor(Math.random() * 10) + 100}`,
                  customerName: 'Simulated Customer',
                  customerNumber: `+15550${Math.floor(Math.random() * 900) + 100}`,
                  state: CallState.CONNECTED,
                  duration: 0,
                  startTime: Date.now()
              });
          }
          
          // Update durations and randomly end calls
          this.simulatedCalls = this.simulatedCalls.filter(call => {
             call.duration = Math.floor((Date.now() - call.startTime) / 1000);
             // 10% chance to end call
             return Math.random() > 0.1; 
          });

          this.broadcastActiveCalls();
      }, 2000);
  }

  private getCombinedActiveCalls(): ActiveCall[] {
      const calls = [...this.simulatedCalls];
      if (this.state !== CallState.IDLE && this.activeNumber) {
          calls.unshift({
              id: 'local-user',
              agentName: this.extension ? `Ext ${this.extension}` : 'You',
              customerName: 'Current Call',
              customerNumber: this.activeNumber,
              state: this.state,
              duration: this.activeStartTime ? Math.floor((Date.now() - this.activeStartTime) / 1000) : 0,
              startTime: this.activeStartTime || Date.now()
          });
      }
      return calls;
  }

  private broadcastActiveCalls() {
      const calls = this.getCombinedActiveCalls();
      this.activeCallsListeners.forEach(l => l(calls));
  }
}

export const sipService = new SipService();

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ticket } from '../../interfaces/ticket.interface';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { SectionsResponse, Section } from '../../interfaces/section.interface';
import { LocationsResponse, Location } from '../../interfaces/location.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { SettingsResponse } from '../../interfaces/settings.interface';
import { Settings } from 'src/app/interfaces/settings.interface';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PublicService {

  tickets: Ticket[] = [];
  sections: Section[] = [];
  canAksPositionUser = false; // for best practices, ask user when interacts with UI.
  settings: Settings;
  customer: any;

  chatMessages: {
    own: boolean,
    time: Date,
    message: string,
    viewed: boolean
  }[] = [];


  constructor(
    private http: HttpClient,
    private router: Router,
    private _snack: MatSnackBar

  ) { }


  snack(msg: string, dur: number, button?: string): Promise<boolean> {
    return new Promise((resolve) => {
      this._snack.open(msg, button, { duration: dur }).afterDismissed().subscribe(data => {
        if (data.dismissedByAction) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
    })
  }

  scrollTop() {
    document.body.scrollTop = 0; // Safari
    document.documentElement.scrollTop = 0; // Other
    document.getElementsByClassName('mat-drawer-content')[0].scrollTop = 0;
  }

  stepperGoBack(stepper: MatStepper) {
    stepper.previous();
  }

  stepperGoNext(stepper: MatStepper) {
    this.scrollTop();
    stepper.next();
  }

  stepperReset(stepper: MatStepper) {
    stepper.reset();
  }

	// ========================================================
	// Register Methods
	// ========================================================

	registerUser(user: any) {
		let data = { user };
		const url = environment.api + '/u/registeruser';
		return this.http.post(url, data);
	}

	activateUser(email: string, hash: string) {
		let data = { email, hash };
		const url = environment.api + '/u/activate';
		return this.http.post(url, data);
	}

	checkEmailExists(pattern: string) {
		let data = { pattern }
		const url = environment.api + '/u/checkemailexists';
		return this.http.post(url, data);
	}

	loginCustomer(platform: string, token: string, user: any, recordar: boolean = false) {

		recordar ? localStorage.setItem('email', user.tx_email) : localStorage.removeItem('email');

    
		let api: string;
		let data: any;
		switch (platform) {
			case 'google':
			case 'facebook':
				api = '/u/loginsocial';
				data = { token, user, isAdmin: false }; // isAdmin (ADMIN_ROLE or CUSTOMER_ROLE) used for create if user not exist on login
				break;
			case 'email':
				api = '/u/loginuser';
				data = user;
				break;
			default:
				api = '/u/loginuser';
				break;
		}

		const url = environment.api + api;

		return this.http.post(url, data).pipe(map((resp: any) => {
			localStorage.setItem('customer', JSON.stringify(resp.user));
			this.customer = resp.customer;
			return resp;
		}),
			catchError(err => {
				return throwError(err);
			})
		);
	}


  buscarLocalidades(pattern): Promise<LocationsResponse> {
    return new Promise((resolve, reject) => {
      const regex = new RegExp(/^[a-z ñ0-9]+$/i);
      if (!regex.test(pattern) && pattern) {
        this.snack('¡Ingrese sólo caracteres alfanuméricos!', 2000);
        reject();
        return;
      }

      const url = environment.api + '/p/locations/' + pattern;
      this.http.get(url).subscribe((resp: LocationsResponse) => {
        if (resp.ok) {
          resolve(resp);
          return resp;
        }
      });
    });
  }

  buscarBaresEnLocalidad(idLocation: string) {
    return this.http.get(environment.api + '/p/findinlocation/' + idLocation);
  }

  findCompany(pattern: string): Observable<object> {
    return this.http.get(environment.api + '/c/findcompany/' + pattern);
  }

  readCompany(txCompanyString: string): Observable<object> {
    return this.http.get(environment.api + '/c/readcompany/' + txCompanyString);
  }

  readSettings(idCompany: string): Observable<object> {
    const url = environment.api + '/settings/readsettings/' + idCompany;
    return this.http.get(url);
  }

  readSections(idCompany: string) {
    const url = environment.api + '/section/readsections/' + idCompany;
    return this.http.get(url);
  }

  readAvailability(nmPersons: number | string, idSection: string, dtReserve: Date): Observable<object> {
    let data = { nmPersons, idSection, dtReserve };
    return this.http.post(environment.api + '/t/readavailability/', data);
  }

  getUserTickets(txPlatform: string, txEmail: string) {
    if (!txPlatform || !txEmail) { return; }
    const url = environment.api + '/t/readusertickets/' + txPlatform + '/' + txEmail;
    return this.http.get(url);
  }

  updateStorageTickets(ticket: Ticket): Promise<Ticket[]> {
    return new Promise((resolve) => {
      let tickets: Ticket[] = [];
      if (localStorage.getItem('tickets')) {
        tickets = JSON.parse(localStorage.getItem('tickets'));
        if (tickets.length > 0) {
          tickets = tickets.filter((tkt: Ticket) => tkt._id !== ticket._id); // quito el viejo 
        }
      }
      tickets.push(ticket); // agrego el nuevo
      tickets.sort((b, a) => +new Date(a.tm_start) - +new Date(b.tm_start));
      localStorage.setItem('tickets', JSON.stringify(tickets));
      console.table(tickets, ['tx_status', 'id_user', 'tx_platform', 'id_company.tx_company_name', 'tm_reserve', '_id'])
      resolve(tickets);
    })
  }

  createTicket(
    txName: string,
    nmPersons: number,
    idSection: string,
    tmReserve: Date,
    cdTables: number[],
    blContingent: boolean,
    idSocket: string,
    ): Observable<object> {
    let data = { txName, nmPersons, idSection, tmReserve, cdTables, blContingent, idSocket };
    return this.http.post(environment.api + '/t/createticket/', data);
  }

  // google devuelve un token, pero puedo usar una api para obtener directamente los datos del usuario
  validateTicket(idTicket: string, txPlatform: string, txToken: string, txEmail: string, txName: string) {
    const api = '/t/validateticket';
    const data = { idTicket, txPlatform, txToken, txEmail, txName};
    const url = environment.api + api;
    return this.http.post(url, data);
  }

  getTickets(idCompany: string) {
    if (!idCompany) { return; }
    const url = environment.api + '/t/readtickets/' + idCompany;
    return this.http.get(url);
  }

  getTicket(idTicket: string) {
    if (!idTicket) { return; }
    const url = environment.api + '/t/readticket/' + idTicket;
    return this.http.get(url);
  }


  actualizarSocket(idTicket: string, newSocket: string, isClient: boolean): Observable<object> {
    const socketsData = { idTicket, newSocket, isClient };
    return this.http.put(environment.api + '/t/actualizarsocket', socketsData);
  }

  callWaiter(idTicket: string, txCall: string) {
    return this.http.post(environment.api + '/t/callwaiter/', { idTicket, txCall });
  }

  endTicket(idTicket: string, reqBy: string) {
    return this.http.post(environment.api + '/t/endticket/', { idTicket, reqBy });
  }

  getScoreItems(idSection: string) {
    const url = environment.api + `/p/getscoreitems/` + idSection;
    return this.http.get(url);
  }

  sendScores(cdScores: any) {
    const url = environment.api + `/p/postscores`;
    return this.http.post(url, cdScores);
  }

  sendContact(data: any) {
    const url = environment.api + `/p/contact`;
    return this.http.post(url, data);
  }

  drawerScrollTop(): void {
    let ref = document.getElementsByClassName('mat-drawer-content')[0];
    ref.scrollTop = 0;
  }

  clearPublicSession(): void {
    this.chatMessages = [];
    delete this.tickets;
    // if (localStorage.getItem('tickets')) { localStorage.removeItem('tickets'); }
    if (localStorage.getItem('company')) { localStorage.removeItem('company'); }
    if (localStorage.getItem('social')) { localStorage.removeItem('social'); }
    if (localStorage.getItem('customer')) { localStorage.removeItem('customer'); }

    this.router.navigate(['/public/login']);
  }


}

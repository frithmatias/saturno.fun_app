import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { User } from 'src/app/interfaces/user.interface';
import { map, catchError } from 'rxjs/operators';
import { throwError, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Notification } from '../interfaces/notification.interface';

@Injectable({
	providedIn: 'root'
})
export class LoginService {

	token: string;
	menu: any[] = [];
	role: string;

	public notifications: Notification[] = [];
 
	// user observable
	public user: User;
	private userSource = new Subject<User>();
	public user$ = this.userSource.asObservable();


	constructor(
		private http: HttpClient,
		private router: Router
	) {

		if (localStorage.getItem('token')) { this.token = JSON.parse(localStorage.getItem('token')); }
		if (localStorage.getItem('user')) { this.menu = JSON.parse(localStorage.getItem('menu')); }
		if (localStorage.getItem('menu')) {
			let user = JSON.parse(localStorage.getItem('user'));
			this.pushUser(user);
		}
	}

	// ========================================================
	// Register Methods
	// ========================================================

	registerUser(user: any) {
		const url = environment.api + '/u/registeruser';
		return this.http.post(url, user);
	}

	checkEmailExists(pattern: string) {
		let data = { pattern }
		const url = environment.api + '/u/checkemailexists';
		return this.http.post(url, data);
	}

	activateUser(email: string, hash: string) {
		let data = { email, hash };
		const url = environment.api + '/u/activate';
		return this.http.post(url, data);
	}

	// ========================================================
	// Login Methods
	// ========================================================

	loginUser(platform: string, token: string, emailForm: any) {
		if (emailForm) { localStorage.setItem('email', emailForm.tx_email); }

		let api: string;
		let data: any;
		switch (platform) {
			case 'google':
			case 'facebook':
				api = '/u/loginsocial';
				data = { platform, token, isAdmin: true }; // isAdmin (ADMIN_ROLE or CUSTOMER_ROLE) used for create if user not exist on login
				break;
			case 'email':
				api = '/u/loginuser';
				data = emailForm;
				break;
		}

		const url = environment.api + api;

		return this.http.post(url, data).pipe(map((resp: any) => {
			localStorage.setItem('token', JSON.stringify(resp.token));
			localStorage.setItem('menu', JSON.stringify(resp.menu));
			localStorage.setItem('user', JSON.stringify(resp.user));
			localStorage.setItem('role', 'user');

			this.token = resp.token;
			this.menu = resp.menu;
			this.user = resp.user;
			this.role = 'user';
			return resp;
		}),
			catchError(err => {
				return throwError(err);
			})
		);
	}

	loginCustomer(platform: string, token: string, emailForm: any) {

		if (emailForm) { localStorage.setItem('email', emailForm.tx_email); }

		let api: string;
		let data: any;
		switch (platform) {
			case 'google':
			case 'facebook':
				api = '/u/loginsocial';
				data = { platform, token, isAdmin: false };
				break;
			case 'email':
				api = '/u/loginuser';
				data = emailForm;
				break;
			default:
				api = '/u/loginuser';
				break;
		}

		const url = environment.api + api;

		return this.http.post(url, data).pipe(map((resp: any) => {
			localStorage.setItem('token', JSON.stringify(resp.token));
			localStorage.setItem('user', JSON.stringify(resp.user));
			localStorage.setItem('role', 'customer');
			this.user = resp.user;
			this.token = resp.token;
			this.role = 'customer';
			return resp;
		}),
			catchError(err => {
				return throwError(err);
			})
		);
	}


	pushUser(user: User) {
		localStorage.setItem('user', JSON.stringify(user));
		this.user = user;
		this.userSource.next(this.user);
	}

	updateToken() {
		const url = environment.api + '/u/updatetoken';
		// url += '?token=' + this.token;

		let data = { user: this.user };
		return this.http.post(url, data)
			.pipe(map((resp: any) => {
				if (resp.ok) {
					this.token = resp.newtoken;
					localStorage.setItem('token', JSON.stringify(this.token));
				} else {
					this.logout();
				}
				return resp;
			}));

	}

	logout() {

		if (localStorage.getItem('user')) { localStorage.removeItem('user'); }
		if (localStorage.getItem('role')) { localStorage.removeItem('role'); }
		if (localStorage.getItem('token')) { localStorage.removeItem('token'); }
		if (localStorage.getItem('menu')) { localStorage.removeItem('menu'); }

		if (localStorage.getItem('table')) { localStorage.removeItem('table'); }
		if (localStorage.getItem('tables')) { localStorage.removeItem('tables'); }
		if (localStorage.getItem('section')) { localStorage.removeItem('section'); }
		if (localStorage.getItem('session')) { localStorage.removeItem('session'); }

		delete this.user;
		delete this.role;
		delete this.token;
		delete this.menu;

		this.notifications = [];
		this.userSource.next(null)
		this.router.navigate(['/home']);

	}


	checkSuper() {
		const url = environment.api + '/superuser/checksuper';
		return this.http.get(url);
	}

	// ========================================================
	// Shared Methods
	// ========================================================


	readNotifications(idOwner: string) {
		const data = { idOwner };
		const url = environment.api + '/n/readnotifications';
		return this.http.post(url, data);
	}

	updateNotificationsRead(idNotifications: string[], idUser: string) {
		const data = {idNotifications, idUser};
		const url = environment.api + '/n/updatenotificationsread';
		return this.http.post(url, data);
	}

	updateNotificationRead(idNotifications: string, idUser: string) {
		const data = {idNotifications, idUser};
		const url = environment.api + '/n/updatenotificationsread';
		return this.http.post(url, data);
	}

}

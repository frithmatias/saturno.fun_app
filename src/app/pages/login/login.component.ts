import { NgForm } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { WebsocketService } from '../../services/websocket.service';
import { LoginService } from '../../services/login.service';
import { NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { PublicService } from '../../modules/public/public.service';
import { LoginResponse } from '../../interfaces/login.interface';
import { Social } from '../../components/social/social.component';

declare const gapi: any;

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

	email: string;
	hidepass = true;
	recuerdame = false;
	auth2: gapi.auth2.GoogleAuth; // info de google con el token
	socialToken: string = null;

	constructor(
		public publicService: PublicService,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private loginService: LoginService,
		private wsService: WebsocketService,
		private zone: NgZone
	) { }

	ngOnInit() { }

	// ==========================================================
	// LOGIN FORM 
	// ==========================================================

	loginEmail(forma: NgForm) {
		if (forma.invalid) {
			return;
		}
		const emailForm: any = {
			tx_name: null,
			tx_email: forma.value.email,
			tx_password: forma.value.password,
			bl_admin: true 
		};
		const platform = 'email';
		this.loginUser(platform, null, emailForm);
	}

	socialResponse(social: Social) {

		if (!social || !social.txToken) {
			this.publicService.snack('No se pudo conectar con la red social', 5000, 'Aceptar');
			return;
		}

		this.socialToken = social.txToken;
		const platform = social.txPlatform;

		this.loginUser(platform, social.txToken, null);
	}

	loginUser(platform: string, token: string, emailForm: any) {
		this.loginService.loginUser(platform, token, emailForm).subscribe((data: LoginResponse) => {
			if (data.ok) {
				if (data.user.id_company) {
					const idCompany = data.user.id_company._id;
					this.wsService.emit('enterCompany', idCompany);
				}
				// window.location.href = '/admin';
				this.router.navigate([data.home]);
			}
		}, (err: HttpErrorResponse) => {
			if (err.error.msg) {
				this.publicService.snack(err.error.msg, 5000, 'Aceptar');
			} else {
				this.publicService.snack('Error de validación', 5000, 'Aceptar');
			}
		});

	}

	cleanEmail(elementEmail, elementPassword) {
		elementEmail.value = null;
		elementPassword.value = null;
		if (localStorage.getItem('email')) {
			localStorage.removeItem('email');
		}
	}

}

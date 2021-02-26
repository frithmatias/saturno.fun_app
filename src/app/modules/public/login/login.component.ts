import { NgForm } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { PublicService } from '../public.service';
import { LoginResponse } from '../../../interfaces/login.interface';
import { Social } from 'src/app/components/social/social.component';


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

	constructor(
		public publicService: PublicService,
		public router: Router,
		public activatedRoute: ActivatedRoute,
		private zone: NgZone
	) { }

	ngOnInit() {
	}

	loginEmail(forma: NgForm) {

		if (forma.invalid) {
			return;
		}

		const user: any = {
			tx_name: null,
			tx_email: forma.value.email,
			tx_password: forma.value.password,
			id_company: null
		};


		this.publicService.loginCustomer(user).subscribe((data: LoginResponse) => {
			if (data.ok) {
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

	loginSocial(social: Social) {
		if (localStorage.getItem('customer') || localStorage.getItem('social')) {
			this.router.navigate(['/public/tickets'])
		}
	}

	cleanEmail(elementEmail, elementPassword) {
		elementEmail.value = null;
		elementPassword.value = null;
		if (localStorage.getItem('email')) {
			localStorage.removeItem('email');
		}
	}

}
import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray } from '@angular/forms';
import { Router } from '@angular/router';

import { WebsocketService } from '../../../../services/websocket.service';
import { PublicService } from '../../public.service';

import { Section } from 'src/app/interfaces/section.interface';
import { TicketResponse, Ticket, TicketsResponse } from '../../../../interfaces/ticket.interface';
import { SectionsResponse } from '../../../../interfaces/section.interface';

import { Company } from '../../../../interfaces/company.interface';
import { Subscription } from 'rxjs';
import { Social } from '../../../../components/social/social.component';
import { HttpErrorResponse } from '@angular/common/http';
import { User } from 'src/app/interfaces/user.interface';
import { availabilityResponse, optionInterval } from 'src/app/interfaces/availability.interface';
import { DateToStringPipe } from '../../../../pipes/date-to-string.pipe';

@Component({
  selector: 'app-ticket-create',
  templateUrl: './ticket-create.component.html',
  styleUrls: ['./ticket-create.component.css']
})
export class TicketCreateComponent implements OnInit {

  @Input() company: Company;

  social: Social; // customer logged with social
  customer: User; // customer logged with email
  loading: boolean = false;
  sections: Section[] = [];
  ticket: Ticket = null; // ACTIVE ticket
  tickets: Ticket[] = [];

  ticketForm: FormGroup;
  tmIntervals: Date[] = [];

  minDate: Date;
  maxDate: Date;
  optionInterval: optionInterval[] = [];
  availableTables: number[];
  updateTicketsSub: Subscription;
  tellUserNotAvailable = false;
  showRequestTable = false;
  activeTickets = ['waiting', 'pending', 'scheduled', 'queued', 'requested', 'assigned', 'provided']; // terminated filtered in backend.
  serverMessage: string;

  constructor(
    private wsService: WebsocketService,
    public publicService: PublicService,
    private router: Router,
    private dateToString: DateToStringPipe
  ) {

    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1);
    this.minDate = today;
    this.maxDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); //14 days

  }

  ngOnInit(): void {
    this.getSections();
    this.createTicketForm();
    this.checkFormChanges();
    this.checkCustomer();
    this.checkWaitingTicket();
    this.checkTicketUpdate();
  }

  checkTicketUpdate() {
    this.updateTicketsSub = this.wsService.updateTicket().subscribe((ticket: Ticket) => {
      // id_company en el metodo provide() del backend NO viene populado
      ticket.id_company = this.ticket?.id_company;
      this.ticket = ticket;
      this.publicService.updateStorageTickets(ticket);
    });
  }

  getSections() {
    // get sections
    if (!this.company) {
      this.publicService.snack('Por favor elegí un bar primero.', 2000);
      this.router.navigate(['/public']);
    } else {
      let idCompany = this.company._id;
      this.wsService.emit('enterCompany', idCompany);
      this.loading = true;
      this.publicService.readSections(idCompany).subscribe((data: SectionsResponse) => {
        this.loading = false;
        this.sections = data.sections;
      })
    }
  }

  checkCustomer() {
    // Get social data

    if (localStorage.getItem('customer')) {
      this.customer = JSON.parse(localStorage.getItem('customer'));
      const txPlatform = this.customer.tx_platform;
      const txEmail = this.customer.tx_email;
      if (txPlatform && txEmail) {
        this.getUserTickets(txPlatform, txEmail); // update tickets
      }
    }
  }

  checkWaitingTicket(): void {
    // si se recarga la página cuando hay un ticket 'waiting', el ticket se salva y queda en 'tickets' 
    // ahora tengo que levantarlo y guardarlo en mi 'ticket' (ticket activo)
    if (localStorage.getItem('tickets')) {
      this.tickets = JSON.parse(localStorage.getItem('tickets'));
      this.ticket = this.tickets.find(ticket => this.activeTickets.includes(ticket.tx_status));
    }
  }

  getUserTickets(txPlatform: string, txEmail: string): void {
    this.loading = true;

    // if exists get waiting ticket
    let waiting: Ticket[] = [];
    if (localStorage.getItem('tickets')) {
      waiting = JSON.parse(localStorage.getItem('tickets')).filter((ticket: Ticket) => ticket.tx_status === 'waiting');
    }

    this.publicService.getUserTickets(txPlatform, txEmail).subscribe((data: TicketsResponse) => {
      this.loading = false;
      if (data.ok) {
        this.tickets = data.tickets;
        if (waiting.length > 0) { this.tickets.push(...waiting); }
        this.tickets = this.tickets.sort((b, a) => +new Date(a.tm_start) - +new Date(b.tm_start));
        this.ticket = this.tickets.find(ticket => ticket.id_company._id === this.company._id && this.activeTickets.includes(ticket.tx_status));
        localStorage.setItem('tickets', JSON.stringify(this.tickets));
        console.table(this.tickets, ['tx_status', 'id_user', 'tx_platform', 'id_company.tx_company_name', 'tm_intervals', '_id'])
      }
    }, () => { this.loading = false; })
  }

  createTicketForm() {

    this.ticketForm = new FormGroup({
      txName: new FormControl('', [Validators.required, Validators.maxLength(30)]),
      nmPersons: new FormControl('', [Validators.required, Validators.min(1), Validators.max(1000)]),
      idSection: new FormControl('', [Validators.required]),
      txWhen: new FormControl(''),
      dtReserve: new FormControl({ value: '', disabled: true }, [Validators.required]),
      tmIntervals: new FormControl({ value: '', disabled: true }, [Validators.required]),
      cdTables: new FormControl({ value: '', disabled: true }, [Validators.required]),
    });
  }

  checkFormChanges() {

    // PERSONS CHANGE 
    this.ticketForm.controls.idSection.valueChanges.subscribe(data => {
      this.readAvailability();
      this.ticketForm.controls.tmIntervals.reset();
      this.ticketForm.controls.cdTables.reset();
    })

    // SECTION CHANGE 
    this.ticketForm.controls.nmPersons.valueChanges.subscribe(data => {
      this.readAvailability();
      this.ticketForm.controls.tmIntervals.reset();
      this.ticketForm.controls.cdTables.reset();
    })

    // WHEN CHANGE
    this.ticketForm.controls.txWhen.valueChanges.subscribe(data => {
      if (data === 'otrodia') {
        this.ticketForm.controls.dtReserve.enable();
      }
      if (data === 'ahora') {
        this.ticketForm.controls.dtReserve.reset();
        this.ticketForm.controls.tmIntervals.reset();
        this.ticketForm.controls.cdTables.reset();
        this.ticketForm.controls.dtReserve.disable();
        this.ticketForm.controls.tmIntervals.disable();
        this.ticketForm.controls.cdTables.disable();

      }
    })

    // DATE CHANGE
    this.ticketForm.controls.dtReserve.valueChanges.subscribe(data => {

      if (data) {
        this.readAvailability();
        this.ticketForm.controls.tmIntervals.enable();
      }
    })

    // INTERVALS CHANGE
    this.ticketForm.controls.tmIntervals.valueChanges.subscribe(data => {

      if (!data) {
        return;
      }

      if (data.length === 0) {
        return;
      }
      // recibo un array de dates 
      // cruzo con availability para esos intervalos y traigo las tables que estén en todos los intervalos 
      let optionInterval: optionInterval[] = this.optionInterval.filter(av => data.includes(av.date));
      let avTablesFirstInterval = optionInterval[0].compatible;

      // intervalo 0: [1,3,4,5] -> avTablesFirstInterval
      // intervalo 1: [1,4] -> filtro las mesas 3 y 5
      // intervalo 2: [4] -> filtro la mesa 1
      // ...
      // resultado [4] solo disponible la mesa 4

      optionInterval.forEach((av: optionInterval) => {
        this.availableTables = avTablesFirstInterval.filter(n => av.compatible.includes(n))
      })

      this.ticketForm.controls.cdTables.enable();

    })
  }

  readAvailability() {

    const nmPersons = this.ticketForm.controls.nmPersons.value;
    const idSection = this.ticketForm.controls.idSection.value;
    const dtReserve = this.ticketForm.controls.dtReserve.value;

    if (!nmPersons || !idSection || !dtReserve) {
      return;
    }

    this.optionInterval = [];
    this.ticketForm.controls.tmIntervals.reset();

    this.publicService.readAvailability(nmPersons, idSection, dtReserve).subscribe((data: availabilityResponse) => {
      if (data.ok) {
        this.tellUserNotAvailable = false;
        if (data.compatible) {

          // OK: TRUE -> Encontró mesas compatibles
          data.availability.forEach(av => {
            if (av.compatible.length > 0) {
              this.optionInterval.push({
                disabled: false,
                date: new Date(av.interval),
                text: this.dateToString.transform(new Date(av.interval), 'time-24'),
                compatible: av.compatible
              })
            } else {
              this.optionInterval.push({
                disabled: true,
                date: new Date(av.interval),
                text: this.dateToString.transform(new Date(av.interval), 'time-24') + ' No disponible',
                compatible: null
              })
            }
          })

        } else {

          this.tellUserNotAvailable = true;
          // OK: FALSE -> Solicitud de mesa, NO encontró mesas compatibles, el ticket quedará pending luego de confirmar. 
          this.ticketForm.controls.cdTables.disable();
          data.availability.forEach(av => {
            this.optionInterval.push({
              disabled: this.ticketForm.value.nmPersons > av.capacity,
              date: new Date(av.interval),
              text: this.dateToString.transform(new Date(av.interval), 'time-24') + ' Max ' + av.capacity,
              compatible: [0]
            })
          })
          
        }

      }

    })
  }

  setInterval(interval: any) {
    this.tmIntervals.includes(interval.date) ? this.tmIntervals.filter(int => int !== interval.date) : this.tmIntervals.push(interval.date);
  }

  createTicket(): void {

    if (this.ticketForm.invalid) {
      this.publicService.snack('Ingrese sector y cantidad de personas', 3000);
      return;
    }

    if (localStorage.getItem('user')) {
      this.publicService.snack('Tenes una sesión de comercio activa.', 5000)
      return;
    }

    let blContingent = false;
    let idSocket = this.wsService.idSocket;
    let txName = this.ticketForm.value.txName;
    let nmPersons = this.ticketForm.value.nmPersons;
    let idSection = this.ticketForm.value.idSection;
    let tmIntervals = this.ticketForm.value.tmIntervals || [];
    let cdTables: number[] = this.ticketForm.value.cdTables || []; // 0 if not compatible tables
    this.loading = true;

    this.publicService.createTicket(txName, nmPersons, idSection, tmIntervals, cdTables, blContingent, idSocket).subscribe(
      (data: TicketResponse) => {
        if (data.ok) {
          this.loading = false;
          this.ticket = data.ticket;
          data.ticket.id_company = this.company;
          this.publicService.updateStorageTickets(data.ticket).then((tickets: Ticket[]) => {
            this.tickets = tickets;
          })
          // this.router.navigate(['/public/tickets']);
        }
      }, (err) => {
        this.loading = false;
        this.publicService.snack(err.error.msg, 5000)
      }
    );
  }

  validateTicket(ticket: Ticket) {

    if (!this.customer) {
      return;
    }

    const idTicket = ticket._id;

    this.publicService.validateTicket(idTicket).subscribe((data: TicketResponse) => {
      if (data.ok) {
        this.publicService.updateStorageTickets(data.ticket).then((tickets: Ticket[]) => {
          this.tickets = tickets;
          this.ticket = tickets.find(ticket => ticket._id === this.ticket._id);
          this.publicService.snack(data.msg, 5000, 'Aceptar');
        })
      } else {
        this.publicService.snack(data.msg, 5000, 'Aceptar');
      }
    }, (err: HttpErrorResponse) => {
      this.publicService.snack(err.error.msg, 5000, 'Aceptar');
    });
  }

  salir(): void {
    this.publicService.clearPublicSession();
    this.router.navigate(['/home'])
  }
}




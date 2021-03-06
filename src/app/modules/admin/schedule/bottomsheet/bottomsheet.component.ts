import { Inject } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { avTable, avInterval } from '../../../../interfaces/availability.interface';
import { TicketResponse } from '../../../../interfaces/ticket.interface';
import { PublicService } from '../../../public/public.service';
import { WaiterService } from '../../../waiter/waiter.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AdminService } from '../../admin.service';
import { MessageResponse } from '../../../../interfaces/messenger.interface';


interface dataSheet {
  table: avTable, // table selected in calendar
  avInterval: avInterval, // interval selected in calendar
  availability: avInterval[], // \all intervals
  idSection: string
}

@Component({
  selector: 'app-bottomsheet',
  templateUrl: './bottomsheet.component.html',
  styleUrls: ['./bottomsheet.component.css']
})
export class BottomsheetComponent implements OnInit {

  ticketForm: FormGroup;
  personsExceeds = false;
  cdTables: number[] = [];
  title: string;
  subtitle: string;
  showMessageForm = false;
  nmOccupation: number;

  constructor(
    private bottomSheetRef: MatBottomSheetRef<BottomsheetComponent>,
    private publicService: PublicService,
    private waiterService: WaiterService,
    private adminService: AdminService,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: dataSheet
  ) {

    if (this.data.table.blReserved) {
      // click on reserved cell
      this.nmOccupation = Math.round(this.data.table.nmPersons / this.data.table.ticketOwner.nm_persons * 100);
    } else {
      // click to open form to reserve cell
      this.cdTables.push(this.data.table.nmTable);
      // agrego una propiedad ['enabled'] para activar/desactivar los intervalos que no tienen disponible TODAS 
      // las mesas seleccionadas.
      this.checkIntervalsAvailability();
    }
  }

  ngOnInit(): void {
    this.ticketForm = new FormGroup({
      txName: new FormControl('', [Validators.required, Validators.maxLength(30)]),
      nmPersons: new FormControl('', [Validators.required, Validators.min(1), Validators.max(1000)]),
      tmIntervals: new FormControl('', [Validators.required]),
      txEmail: new FormControl('', [Validators.email, Validators.maxLength(50)]),
      nmPhone: new FormControl('', [Validators.min(999999), Validators.max(99999999999)])
    });

    this.ticketForm.controls.nmPersons.valueChanges.subscribe(persons => {
      this.personsExceeds = persons > this.data.table.nmPersons ? true : false;
    })

    this.ticketForm.controls.tmIntervals.setValue([this.data.avInterval.interval])

  }

  setReserve = (table: avTable) => {
    this.cdTables = this.cdTables.includes(table.nmTable)
      ? this.cdTables.filter((numtable) => numtable !== table.nmTable)
      : [...this.cdTables, table.nmTable];
    // si cambio las mesas vuelvo a setear el intervalo por defecto
    this.ticketForm.controls.tmIntervals.setValue([this.data.avInterval.interval]);
    this.checkIntervalsAvailability();
  };

  checkIntervalsAvailability() {
    // Cambia dinámicamente las opciones para seleccionar intervalos disponibles, si el admin selecciona mas mesas, al seleccionar una 
    // mesa nueva verifica para que intervalos existen reservas para esas mesas seleccionadas y crea 'enabled' = false para dehabilitar 
    // los intervalos para los cuales alguna de las mesas seleccionadas tiene otra reserva

    this.data.availability.forEach(av => {
      av['enabled'] = this.cdTables.every(t => av.available.filter(a => !a.blReserved).map(a => a.nmTable).includes(t));
      av['reserved'] = av.available.filter(a => a.blReserved).map(a => a.nmTable);
      let selectedReserved = av['reserved'].filter((table: number) => this.cdTables.includes(table));
      let selectedText: string = selectedReserved.length > 1 ? 'Las mesas ' : 'La mesa ';
      for (let [index, table] of selectedReserved.entries()) {
        if (index >= selectedReserved.length - 1 && selectedReserved.length > 1) selectedText += ' y '
        selectedText += table.toString();
      }

      selectedText += selectedReserved.length > 1 ? ' están reservas.' : ' está reservada.'
      av['msg'] = selectedText;
    });
  }

  createTicket(): void {

    if (this.cdTables.length === 0) {
      this.publicService.snack('Seleccione al menos una mesa.', 3000);
      return;
    }

    if (this.ticketForm.invalid) {
      this.publicService.snack('Faltan datos por favor verifique.', 3000);
      return;
    }

    const blContingent = true;
    const txName = this.ticketForm.value.txName;
    const nmPersons = this.ticketForm.value.nmPersons;
    const idSection = this.data.idSection;
    const txEmail = this.ticketForm.value.txEmail;
    const nmPhone = this.ticketForm.value.nmPhone;
    const cdTables = this.cdTables;
    const tmintervals = this.ticketForm.value.tmIntervals;


    this.adminService.createTicket(blContingent, txName, nmPersons, idSection, tmintervals, txEmail, nmPhone, cdTables).subscribe((resp: TicketResponse) => {
      if (resp.ok) {
        this.bottomSheetRef.dismiss({
          action: 'create',
          ticket: resp.ticket // updated ticket with no cdTables []
        });
      } else {
        this.publicService.snack('Error al asignar las mesas!', 2000);
      }
    }
    );
  }

  assignTablesPending = () => {
    // asigna cero mesas
    let blPriority = this.data.table.ticketOwner.bl_priority;
    let blFirst = false;
    let idTicket = this.data.table.ticketOwner._id;
    let cdTables = [];

    this.waiterService.assignTablesPending(idTicket, blPriority, blFirst, cdTables).subscribe((resp: TicketResponse) => {
      if (resp.ok) {
        this.bottomSheetRef.dismiss({
          action: 'release',
          ticket: resp.ticket // updated ticket with no cdTables []
        });
      } else {
        this.publicService.snack('Error al asignar las mesas!', 2000);
      }
    },
      () => {
        this.publicService.snack('Error al asignar las mesas!', 2000);
      }
    );
  };

  endTicket = () => {

    const ticket = this.data.table.ticketOwner;

    if (!ticket) {
      this.publicService.snack('Seleccione una mesa primero', 3000);
    }

    const idTicket = ticket._id;
    const reqBy = 'client';
    this.publicService.snack('Desea finalizar el ticket actual?', 5000, 'FINALIZAR').then((ok) => {

      // publicService.endTicket() 
      // -> reqBy: 'waiter' -> tx_status: 'finished'
      // -> reqBy: 'client' -> tx_status: 'cancelled'
      if (ok) {
        this.publicService.endTicket(idTicket, reqBy).subscribe((resp: TicketResponse) => {
          if (resp.ok) {
            this.bottomSheetRef.dismiss({ action: 'cancel', ticket: resp.ticket });
          } else {
            this.publicService.snack('Error al asignar las mesas!', 2000);
          }
        });
      }
    });
  };

  closeBottomSheet() {
    this.bottomSheetRef.dismiss();
  }

  messageResponse(response: MessageResponse) {
    this.publicService.snack(response.msg, 5000, 'Aceptar');
    this.showMessageForm = false;
  }

}

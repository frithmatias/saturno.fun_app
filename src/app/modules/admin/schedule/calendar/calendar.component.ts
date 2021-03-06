import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { avInterval, avTable } from '../../../../interfaces/availability.interface';
import { Table } from 'src/app/interfaces/table.interface';
import { PublicService } from '../../../public/public.service';
import { BottomsheetComponent } from '../bottomsheet/bottomsheet.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Ticket } from 'src/app/interfaces/ticket.interface';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  @Input() availability: avInterval[] = [];
  @Input() tables: Table[] = [];
  @Input() idSection: string;

  @Output() pendingUpdated: EventEmitter<Ticket> = new EventEmitter();

  // show ticket 
  selectedTable: avTable;

  // create ticket 
  selectedTables: avTable[] = [];
  selectedIntervals: avInterval[] = [];


  constructor(
    private publicService: PublicService,
    private bottomSheet: MatBottomSheet
  ) { }

  ngOnInit(): void { }


  openBottomSheet = (table: avTable, avInterval: avInterval): void => {
    this.selectedTable = table;
    const idSection = this.idSection;
    // table.blReserved ? release : create;
    const availability = this.availability;
    this.bottomSheet.open(BottomsheetComponent, { data: { table, avInterval, availability, idSection } }).afterDismissed().subscribe((data: bottomSheetRelease) => {

      if (data?.action === 'create') {
        this.publicService.snack(`Las mesas ${data.ticket.cd_tables} fueron asignadas correctamente`, 2000, 'Aceptar');
        this.pendingUpdated.emit(data.ticket);
      }

      if (data?.action === 'release') {
        this.publicService.snack(`Las mesas ${data.ticket.cd_tables} fueron liberadas correctamente`, 2000, 'Aceptar');
        this.pendingUpdated.emit(data.ticket);
      }

      if (data?.action === 'cancel') {
        this.publicService.snack(`Las mesas ${data.ticket.cd_tables} fueron canceladas correctamente`, 2000, 'Aceptar');
        this.pendingUpdated.emit(data.ticket);
      }

    })
  }

}

interface bottomSheetRelease {
  // update schedule
  action: string;
  tables: number[];
  interval: number;
  // push on pending tickets
  ticket: Ticket;
}


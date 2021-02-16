import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { availability, avTable } from '../../../../interfaces/availability.interface';
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
  @Input() availability: availability[] = [];
  @Input() tables: Table[] = [];
  @Input() idSection: string;
  @Output() readAvailability = new EventEmitter();

  tableSelected: avTable;

  constructor(
    private publicService: PublicService,
    private bottomSheet: MatBottomSheet

  ) { }

  ngOnInit(): void {}

  openBottomSheet = (table: avTable, availability: availability): void => {
    this.tableSelected = table;
    const idSection = this.idSection;
    // table.blReserved ? release : create;

    this.bottomSheet.open(BottomsheetComponent, { data: { table, availability, idSection } }).afterDismissed().subscribe((data: bottomSheetRelease) => {

      if (data?.action === 'create') {
        this.publicService.snack(`Las mesas ${data.ticket.cd_tables} fueron reservadas correctamente`, 3000, 'Aceptar');
        this.readAvailability.emit();
      }

      if (data?.action === 'release') {
        this.publicService.snack(`Las mesas reservadas a ${data.ticket.tx_name} fueron liberadas correctamente`, 3000, 'Aceptar');
        this.readAvailability.emit();

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


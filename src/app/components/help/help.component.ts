import { Component, OnInit, Inject } from '@angular/core';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';


interface dataSheet {
  idHelp: string
}

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {

  helpTitle: string;
  helpText: string;

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: dataSheet
  ) { }

  ngOnInit(): void {
    switch(this.data.idHelp){
      case 'adminSettingsVirtualQueue':
        this.helpTitle = `COLA VIRTUAL`;
        this.helpText = `
        Es un sistema de generación de "tickets" virtuales que se asigna a un
        cliente cuando solicita una mesa en tiempo real desde la App antes de ingresar a tu negocio.
        Esto te permite tener una trazabilidad punta a punta sobre tus clientes para fines de
        métricas e indicadores, abrir un canal de comunicación con un cliente que espera en una
        COLA VIRTUAL para notificarlo cuando se le aprovisiona una mesa, te permite ofrecerle la
        posibilidad llamar a un camarero en tiempo real, de responder encuestas, etc. El sistema 
        está fuertemente basado en este módulo, recomendamos activar esta opción.`;
      break;
      case 'adminSettingsSPM':
        this.helpTitle = `SPM`;
        this.helpText = `
        Es un Sistema de Provisión de Mesas automático. Si esta opción esta activada el sistema
        asignará automáticamente las mesas disponibles a los clientes que esperan una mesa en la cola
        virtual. Si esta opcion NO esta activada el cliente debe esperar a que un camarero o
        administrador asigne su mesa.`;
      break;
      case 'adminSettingsSchedule':
        this.helpTitle = `AGENDA`;
        this.helpText = `
        Es un sistema de generación de "tickets" virtuales a futuro. Si ésta opción está
        activada, el administrador dispondrá de una agenda para reservar o administrar mesas a sus
        clientes en forma manual. Los clientes puedrán ver desde el formulario en tu página la
        disponibilidad de mesas en tiempo real y crear una reserva un día y un intervalo determinado.

        Si el cliente solicita una mesa para un grupo grande de personas tendrá la opción de
        solicitar una mesa especial. Cuando la hora de reserva se encuentre próxima, el sistema
        comenzará a reservar las mesas asignadas en forma automática y a la hora de la reserva proveera 
        la mesa (o las mesas) y notificará al cliente.`;
      break;
    }
  }
}
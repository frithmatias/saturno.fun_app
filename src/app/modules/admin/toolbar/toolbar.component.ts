import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { PublicService } from 'src/app/modules/public/public.service';
import { LoginService } from '../../../services/login.service';
import { WaiterService } from '../../waiter/waiter.service';
import { filter } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';
import { AdminService } from '../admin.service';
import { CompanyResponse } from '../../../interfaces/company.interface';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.css']
})
export class ToolbarComponent implements OnInit {
  @Output() toggleSideNav: EventEmitter<boolean> = new EventEmitter();
  @Output() toggleChat: EventEmitter<boolean> = new EventEmitter();
  @Input() unreadMessages: number;

  hiddenBadge: boolean;
  version = environment.version;
  constructor(
    public loginService: LoginService,
    public adminService: AdminService,
    public waiterService: WaiterService,
    public publicService: PublicService,
    public router: Router
  ) { }

  ngOnInit(): void {}

  ngOnChanges(changes: any) {
    this.hiddenBadge = false;
  }

  toggle(component: string): void {
    switch (component) {
      case 'sidenav':
        this.toggleSideNav.emit(true);
        break;
      case 'chat':
        this.hiddenBadge = true;
        this.toggleChat.emit(true);
        break;
    }
  }

  scrollToElement(): void {
    // browser autorizado para preguntar posición al usuario
    // todo: re-inicializar el componente mapa mediante en home mediante directiva para preguntar posición al usuario. 
    this.publicService.canAksPositionUser = true;
    const elem = document.getElementById('home-map-container');
    elem?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });

  }


  themeSelected(theme: string) {
    const idCompany = this.loginService.user.id_company._id || null;
    if (idCompany) {
      this.adminService.updateTheme(idCompany, theme).subscribe((data: CompanyResponse) => {
        this.publicService.snack(data.msg, 3000);
      })
    }
  }

  ngOnDestroy(){
  }
}
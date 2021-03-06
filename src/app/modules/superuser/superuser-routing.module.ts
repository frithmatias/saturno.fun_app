import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NopagefoundComponent } from '../../pages/nopagefound/nopagefound.component';
import { MenuComponent } from './menu/menu.component';
import { HomeComponent } from './home/home.component';
import { ChatComponent } from './chat/chat.component';
import { ChatNotInitComponent } from './chat-not-init/chat-not-init.component';
import { CompaniesComponent } from './companies/companies.component';

const publicRoutes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'chatnotinit', component: ChatNotInitComponent },
  { path: 'companies', component: CompaniesComponent },

  { path: '', redirectTo: '/superuser/home', pathMatch: 'full' },
  { path: '**', component: NopagefoundComponent}
];

@NgModule({
  declarations: [],
  imports: [RouterModule.forChild(publicRoutes)], 
  exports: [RouterModule]
})
export class SuperuserRoutingModule { }

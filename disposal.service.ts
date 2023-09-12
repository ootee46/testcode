/* eslint-disable @typescript-eslint/naming-convention */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import queryString from 'query-string';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { EnvironmentService } from 'services/env.service';

@Injectable({
  providedIn: 'root'
})
export class DisposalService {
  private _wasteSubCodes: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _locations: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _assets: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _disposers: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _jobList: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  constructor(private _httpClient: HttpClient, private _envService: EnvironmentService) {
  }
  get jobList$(): Observable<any> {
    return this._jobList.asObservable();
  }
  get wasteSubCodes$(): Observable<any> {
    return this._wasteSubCodes.asObservable();
  }
  get locations$(): Observable<any> {
    return this._locations.asObservable();
  }
  get assets$(): Observable<any> {
    return this._assets.asObservable();
  }
  get disposers$(): Observable<any> {
    return this._disposers.asObservable();
  }

  getDisposalJobList(options: any): Observable<any> {
    const top = options?.top ? options.top : 25;
    const skip = options?.skip ? options.skip : 0;
    const params: any = {
      $top: top,
      $skip: skip,
      $inlinecount: 'allpages',
      $expand: 'WastePackages,WastePackages/WasteMaterials',
      $filterDisposalSearch: 'true',
      $orderby: 'CreatedDate desc'
    };

    let url = this._envService.getEndpoint().wmn + '?' + queryString.stringify(params, { skipNull: true, skipEmptyString: true, encode: false });
    if(options && options.filter){
      url += '&'+ options.filter;
    }

    return this._httpClient.get(url).pipe(
      tap((resp: any) => { this._jobList.next(resp); })
    );
  }
  clearData(): void{
    this._jobList.next(null);
  }
  getWasteSubCodes(): Observable<any> {
    return this._httpClient.get(this._envService.getEndpoint().wasteSubCode + '?$top=300').pipe(
      tap((resp: any) => {
        if(resp && resp.data && resp.data.length > 0){
          resp.data.forEach((element: any) => {
            element.name = element.code + ' ' + element.description;
          });
          this._wasteSubCodes.next(resp.data);
        }else{
          this._wasteSubCodes.next([]);
        }
      })
    );
  }

  getLocations(): Observable<any> {
    return this._httpClient.get(this._envService.getEndpoint().locations).pipe(
      tap((resp: any) => { this._locations.next(resp.data); })
    );
  }

  getAssets(): Observable<any> {
    return this._httpClient.get(this._envService.getEndpoint().assets).pipe(
      tap((resp: any) => { this._assets.next(resp.data); })
    );
  }

  getDisposers(): Observable<any> {
    return this._httpClient.get(this._envService.getEndpoint().disposer).pipe(
      tap((resp: any) => { this._disposers.next(resp.data); })
    );
  }

}

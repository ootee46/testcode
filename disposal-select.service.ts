/* eslint-disable @typescript-eslint/naming-convention */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { isArrayData, setDefaultValue } from 'app/constants/constant';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { EnvironmentService } from 'services/env.service';

@Injectable({
  providedIn: 'root'
})
export class DisposalSelectService {
  private _data: BehaviorSubject<any> = new BehaviorSubject<any>({});
  private _locations: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _assets: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _moderatorLocationSources: BehaviorSubject<any> = new BehaviorSubject<any>({});
  private _packages: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _packageSummaries: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  constructor(private _httpClient: HttpClient, private _envService: EnvironmentService) {
  }

  get data$(): Observable<any> {
    return this._data.asObservable();
  }
  get locations$(): Observable<any> {
    return this._locations.asObservable();
  }
  get assets$(): Observable<any> {
    return this._assets.asObservable();
  }
  get moderatorLocationSources$(): Observable<any> {
    return this._moderatorLocationSources.asObservable();
  }
  get packages$(): Observable<any> {
    return this._packages.asObservable();
  }
  get packageSummaries$(): Observable<any> {
    return this._packageSummaries.asObservable();
  }

  getData(job_number: string): Observable<any> {
    return this._httpClient.get(this._envService.getEndpoint().wmn + '/' + job_number).pipe(
      tap((resp: any) => {
        if (resp?.data) {
          this._data.next(resp.data);
          if (!resp.data.job_status) {
            resp.data.job_status = 'Draft';
          }
          if (resp && resp.data && resp.data.waste_packages) {
            this.unpackPackage(resp.data.waste_packages);
            this._packageSummaries.next(resp.data.waste_packages);
          } else {
            this.unpackPackage([]);
            this._packageSummaries.next([]);
          }
        }
        else {
          this._data.next(null);
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

  getModeratorLocationSource(): Observable<any> {
    return this._httpClient.get(this._envService.getEndpoint().moderatorlocations).pipe(
      tap((resp: any) => {
        if (resp?.data) {
          this._moderatorLocationSources.next(resp.data);
        }
        else {
          this._moderatorLocationSources.next(null);
        }
      })
    );
  }

  unpackPackage(packages: any): void {
    if (isArrayData(packages)) {
      const packageDatas = [];
      packages.forEach((item) => {
        const packageObj: any = cloneDeep(item);
        packageObj.package_name = item.package.name;
        packageObj.packageSelected = item.package;
        packageObj.package_qty = item.quantity;
        packageObj.gross_weight_in_kg = item.gross_weight_in_kg;
        packageObj.total_net_weight = item.total_net_weight;
        packageObj.package_size = String.prototype.concat(
          setDefaultValue(packageObj.packageSelected.width_in_m, '-') +
            ' x ' +
            setDefaultValue(packageObj.packageSelected.length_in_m, '-') +
            ' x ' +
            setDefaultValue(packageObj.packageSelected.height_in_m, '-')
        );
        packageObj.document = [];
        packageObj.pictures = [];
        this.setPackageMaterial(packageDatas, packageObj, item.waste_materials);
      });
      this._packages.next(packageDatas);
    } else {
      this._packages.next([]);
    }
  }

  private setPackageMaterial(
    packageDatas: any,
    packageObj: any,
    waste_materials: any
  ): void {
    if (!isArrayData(waste_materials)) {
      return;
    }
    waste_materials.forEach((item2) => {
      const obj: any = cloneDeep(packageObj);
      obj.remain_weight = item2.weight_in_kg - item2.disposed_weight_in_kg;

      obj.remaining_date = this.setRemainDate(obj, item2);
      obj.material_id = item2.id;
      obj.material_status = item2.status;
      obj.wasteSubCode = item2.waste_sub_code;
      obj.wasteDesc  = item2.waste_sub_code ? item2.waste_sub_code.description : null;
      obj.created_contractor_id = item2.created_contractor_id;
      obj.typeOfWaste = item2.type_of_waste;
      obj.typeOfOperate = {
        title: item2.type_of_operation,
        value: item2.type_of_operation,
      };
      obj.waste_sub_code_id = item2.waste_sub_code_id;
      obj.disposer_id = item2.disposer_id;
      obj.transporter_id = item2.transporter_id;
      obj.type_of_operation = item2.type_of_operation;
      obj.type_of_waste = item2.type_of_waste;
      obj.qty = item2.quantity || 1;
      obj.weight_in_kg = item2.weight_in_kg ? item2.weight_in_kg : 0;
      obj.disposer = item2.disposer;
      obj.disposal_records = item2.disposal_records || [];
      obj.recycle_benefit = item2.recycle_benefit;
      obj.tag = item2.tag || '';
      obj.transporter = item2.transporter;
      obj.manifest_no = item2.manifest_no;
      if (isArrayData(item2.uploads)) {
        item2.uploads.forEach((item3) => {
          if (item3.file_type === 'Document') {
            obj.document.push(item3);
          } else {
            obj.pictures.push(item3);
          }
        });
      }
      packageDatas.push(obj);
    });
  }

  private setRemainDate(obj: any, item2: any): any {
    let remainDate = null;
    if (obj?.remain_weight > 0) {
      const sladuration = item2.waste_sub_code.s_laduration;
      const currentDate = new Date();
      const slaDate = new Date(obj.create_at);
      slaDate.setDate(slaDate.getDate() + sladuration);
      const diffDays = slaDate.getTime() - currentDate.getTime();
      remainDate = Math.ceil(diffDays / (1000 * 3600 * 24)); //- 1;
    }
    return remainDate;
  }
}

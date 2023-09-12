/* eslint-disable @typescript-eslint/naming-convention */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { isArrayData, setDefaultValue } from 'app/constants/constant';
import { cloneDeep,uniq } from 'lodash';
import queryString from 'query-string';
import { BehaviorSubject, Observable, catchError, of, take, tap } from 'rxjs';
import { EnvironmentService } from 'services/env.service';

@Injectable({
  providedIn: 'root',
})
export class WasteService {
  private _jobList: BehaviorSubject<any> = new BehaviorSubject<any>({});
  private _packageList: BehaviorSubject<any> = new BehaviorSubject<any>({});
  private _job: BehaviorSubject<any> = new BehaviorSubject<any>({});
  private _locationSources: BehaviorSubject<any> = new BehaviorSubject<any>({});
  private _moderatorLocationSources: BehaviorSubject<any> =
    new BehaviorSubject<any>({});
  private _assets: BehaviorSubject<any> = new BehaviorSubject<any>({});
  private _packages: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _packageSummaries: BehaviorSubject<any> = new BehaviorSubject<any>(
    []
  );
  private _wasteLogs: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _subCodes: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _disposers: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _disposalCodes: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _transporters: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _users: BehaviorSubject<any> = new BehaviorSubject<any>([]);
  private _wasteMaterials: BehaviorSubject<any> = new BehaviorSubject<any>({});
  constructor(
    private _httpClient: HttpClient,
    private _envService: EnvironmentService
  ) {}
  get jobList$(): Observable<any> {
    return this._jobList.asObservable();
  }
  get job$(): Observable<any> {
    return this._job.asObservable();
  }
  get locationSources$(): Observable<any> {
    return this._locationSources.asObservable();
  }
  get moderatorLocationSources$(): Observable<any> {
    return this._moderatorLocationSources.asObservable();
  }
  get assets$(): Observable<any> {
    return this._assets.asObservable();
  }
  get packages$(): Observable<any> {
    return this._packages.asObservable();
  }
  get packageList$(): Observable<any> {
    return this._packageList.asObservable();
  }
  get packageSummaries$(): Observable<any> {
    return this._packageSummaries.asObservable();
  }
  get wasteLogs$(): Observable<any> {
    return this._wasteLogs.asObservable();
  }
  get subCodes$(): Observable<any> {
    return this._subCodes.asObservable();
  }
  get disposers$(): Observable<any> {
    return this._disposers.asObservable();
  }
  get disposalCodes$(): Observable<any> {
    return this._disposalCodes.asObservable();
  }
  get transporters$(): Observable<any> {
    return this._transporters.asObservable();
  }
  get wasteMaterials$(): Observable<any> {
    return this._wasteMaterials.asObservable();
  }

  get users$(): Observable<any> {
    return this._users.asObservable();
  }

  getJobList(options: any): Observable<any> {
    const top = options?.top ? options.top : 25;
    const next = options?.next ? options.next : 0;
    const params: any = {
      $top: top,
      $skip: next,
      $filterPredefined: 'JobList',
      $orderby: 'CreatedDate desc',
    };

    return this._httpClient
      .get(
        this._envService.getEndpoint().wmn +
          '?' +
          queryString.stringify(params, {
            skipNull: true,
            skipEmptyString: true,
            encode: false,
          })
      )
      .pipe(
        tap((resp: any) => {
          this._jobList.next(resp);
        })
      );
  }

  getJob(job_number: string): Observable<any> {
    return this._httpClient
      .get(this._envService.getEndpoint().wmn + '/' + job_number)
      .pipe(
        tap((resp: any) => {
          if (resp?.data) {
            this._job.next(resp.data);
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
          } else {
            this._job.next(null);
          }
        })
      );
  }

  getLocationSource(): Observable<any> {
    return this._httpClient.get(this._envService.getEndpoint().locations).pipe(
      tap((resp: any) => {
        if (resp?.data) {
          this._locationSources.next(resp.data);
        } else {
          this._locationSources.next(null);
        }
      })
    );
  }

  getModeratorLocationSource(): Observable<any> {
    return this._httpClient
      .get(this._envService.getEndpoint().moderatorlocations)
      .pipe(
        tap((resp: any) => {
          if (resp?.data) {
            this._moderatorLocationSources.next(resp.data);
          } else {
            this._moderatorLocationSources.next(null);
          }
        })
      );
  }

  getAssets(): Observable<any> {
    return this._httpClient.get(this._envService.getEndpoint().assets).pipe(
      tap((resp: any) => {
        if (resp?.data) {
          this._assets.next(resp.data);
        } else {
          this._assets.next(null);
        }
      })
    );
  }

  getPackageList(): Observable<any> {
    return this._httpClient.get(this._envService.getEndpoint().packages).pipe(
      tap((resp: any) => {
        if (resp?.data) {
          this._packageList.next(resp.data);
        } else {
          this._packageList.next(null);
        }
      })
    );
  }

  getWasteSubCode(): Observable<any> {
    return this._httpClient
      .get(this._envService.getEndpoint().wastesubcode)
      .pipe(
        tap((resp: any) => {
          if (resp?.data) {
            if (resp.data) {
              resp.data.forEach((item) => {
                item.fullName = item.code + ' ' + item.description;
              });
            }
            this._subCodes.next(resp.data);
          } else {
            this._subCodes.next(null);
          }
        })
      );
  }

  getDisposer(options: any): Observable<any> {
    let url = '';
    if (options?.filter) {
      const params: any = {
        $filter: options.filter,
      };
      url =
        this._envService.getEndpoint().disposers +
        '?' +
        queryString.stringify(params, {
          skipNull: true,
          skipEmptyString: true,
          encode: false,
        });
    } else {
      url = this._envService.getEndpoint().disposers;
    }
    return this._httpClient.get(url).pipe(
      tap((resp: any) => {
        if (resp?.data) {
          this._disposers.next(resp.data);
        } else {
          this._disposers.next(null);
        }
      })
    );
  }

  getDisposalCode(): Observable<any> {
    return this._httpClient
      .get(this._envService.getEndpoint().disposalCode)
      .pipe(
        tap((resp: any) => {
          if (resp?.data) {
            this._disposalCodes.next(resp.data);
            resp.data.forEach((element) => {
              element.fullName = element.code + ' ' + element.description;
            });
          } else {
            this._disposalCodes.next(null);
          }
        })
      );
  }

  getTransporter(options: any): Observable<any> {
    let url = '';
    if (options?.filter) {
      const params: any = {
        $filter: options.filter,
      };
      url =
        this._envService.getEndpoint().transporters +
        '?' +
        queryString.stringify(params, {
          skipNull: true,
          skipEmptyString: true,
          encode: false,
        });
    } else {
      url = this._envService.getEndpoint().transporters;
    }
    return this._httpClient.get(url).pipe(
      tap((resp: any) => {
        if (resp?.data) {
          this._transporters.next(resp.data);
        } else {
          this._transporters.next(null);
        }
      })
    );
  }

  selectMaterial(material_id: string): Observable<any> {
    return this._httpClient
      .get(this._envService.getEndpoint().wastematerials + '/' + material_id)
      .pipe(
        catchError(() => {
          this._wasteMaterials.next(null);
          return of(null);
        }),
        tap((resp: any) => {
          if (resp?.data) {
            this._wasteMaterials.next(resp.data);
          } else {
            this._wasteMaterials.next(null);
          }
        })
      );
  }

  getLog(job_number: string): Observable<any> {
    return this._httpClient
      .get(this._envService.getEndpoint().wl + '/' + job_number)
      .pipe(
        catchError(() => {
          this._wasteLogs.next(null);
          return of(null);
        }),
        tap((resp: any) => {
          if (resp?.data) {
            this._wasteLogs.next(resp.data);
          } else {
            this._wasteLogs.next(null);
          }
        })
      );
  }

  getUsers(name: string): Observable<any> {
    if (!name || name === '' || name.trim() === '') {
      this._users.next([]);
      return of(true);
    } else {
      const filter =
        'substringof(\'' + name + '\', RequestForUserFullName) eq true';
      return this._httpClient
        .get(this._envService.getEndpoint().wmn + '?$filter=' + filter)
        .pipe(
          tap((resp: any) => {
            if (resp?.data && resp.data.length > 0) {
              this._users.next(
                uniq(resp.data.map(c => c.request_for_user_full_name))
              );
            } else {
              this._users.next([]);
            }
          })
        );
    }
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

  deleteJob(job_number: any): Observable<any> {
    return this._httpClient.delete(
      this._envService.getEndpoint().wmn + '/' + job_number
    );
  }

  createJob(data: any): Observable<any> {
    return this._httpClient.post(this._envService.getEndpoint().wmn, data);
  }
  printoutform(data: any): Observable<any> {
    return this._httpClient.post(
      this._envService.getEndpoint().printform,
      data
    );
  }
  updatePackage(id: any, data: any): Observable<any> {
    return this._httpClient.put(
      this._envService.getEndpoint().wastepackage + '/' + id,
      data
    );
  }
  createMaterial(data: any): Observable<any> {
    return this._httpClient.post(
      this._envService.getEndpoint().wastematerials,
      data
    );
  }
  updateMaterial(materialId: any, data: any): Observable<any> {
    return this._httpClient.put(
      this._envService.getEndpoint().wastematerials + '/' + materialId,
      data
    );
  }
  revertMaterial(materialId: any): Observable<any> {
    return this._httpClient.put(
      this._envService.getEndpoint().wastematerials + '/revert/' + materialId,
      null
    );
  }
  saveJob(data: any): Observable<any> {
    return this._httpClient
      .put(this._envService.getEndpoint().wmn + '/' + data.job_number, data)
      .pipe(
        tap(() => {
          this.getJob(data.job_number).pipe(take(1)).subscribe();
        })
      );
  }

  revertJob(data: any): Observable<any> {
    return this._httpClient
      .put(
        this._envService.getEndpoint().wmn + '/revert/' + data.job_number,
        data
      )
      .pipe(
        tap(() => {
          this.getJob(data.job_number).pipe(take(1)).subscribe();
        })
      );
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

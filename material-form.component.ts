/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { NgForm, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FileUploadComponent } from '@oot/file-upload/file-upload.component';
import { SplashScreenService } from '@oot/splash-screen';
import { AuthService } from 'app/core/auth.service';
import { WasteService } from 'app/core/waste.service';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'material-form',
  templateUrl: './material-form.component.html',
  encapsulation: ViewEncapsulation.None
})

export class MaterialFormComponent implements OnInit, OnDestroy {
  @ViewChild('myForm') myForm: NgForm;
  currentUser$: Observable<any>;
  packageList$: Observable<any>;
  subCodes$: Observable<any>;
  disposers$: Observable<any>;
  transporters$: Observable<any>;
  subCodes: any;
  packageList: any = [];
  currentUser: any = {};
  formTitle: string = '';
  dataForm: UntypedFormGroup;
  newPkg: boolean = false;
  parent: any = {};
  mainData: any = {};
  model: any = {};
  packageSelected: any = null;
  packageModel: any = {};
  checkexitpackage: boolean = false;
  wasteDesc: string = '';
  isTransfer: boolean = false;
  private _uploadForm: MatDialogRef<FileUploadComponent>;
  private _unsubscribeAll: Subject<any> = new Subject();
  constructor(
    @Inject(MAT_DIALOG_DATA) private input: any,
    private _matDialogRef: MatDialogRef<MaterialFormComponent>,
    private _formBuilder: UntypedFormBuilder,
    private _authService: AuthService,
    private _service: WasteService,
    private _matDialog: MatDialog,
    private _splashScreenService: SplashScreenService
  ) { }
  ngOnInit(): void {
    this.initialData();
    this.dataForm = this.createDataForm();
    this.packageList$ = this._service.packageList$;
    this.subCodes$ = this._service.subCodes$;
    this.disposers$ = this._service.disposers$;
    this.transporters$ = this._service.transporters$;
    this.currentUser$ = this._authService.currentUser$;
    this.currentUser$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => {
      this.currentUser = value;
    });
    this.packageList$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => {
      this.packageList = value;
      if (this.parent?.package_id && this.packageList) {
        const objSelect = this.packageList.find(c => c.id === this.parent.package_id);
        if (objSelect) {
          this.packageSelected = objSelect;
        }
      }
    });
    this.subCodes$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => {
      this.subCodes = value;
      if (this.parent.wasteSubCode?.id) {
        const obj = this.subCodes.find(c => c.id === this.parent.wasteSubCode?.id);
        if (obj) {
          this.wasteDesc = obj.description;
        }
      }
    });
  }


  initialData(): void {

    if (this.input?.obj) {
      this.parent = this.input.obj;
    }
    if (this.input?.mainData) {
      this.mainData = this.input.mainData;
    }
    if (this.input?.title) {
      this.formTitle = this.input.title;
    }
    this.packageModel.unique = (this.parent.existPackages);
    this.packageModel.package_id = null;
    this.packageModel.package_no = null;
    this.packageModel.quantity = null;
    this.packageModel.gross_weight_in_kg = null;
    this.packageModel.total_net_weight = null;
    if (this.parent && this.parent.package_id && this.parent.packageSelected) {
      const objSelect = this.packageList.find(c => c.id === this.parent.package_id);
      this.parent.packageSelected = objSelect;
      this.dataForm.updateValueAndValidity();
    }
  }

  onPackageSelect(event: any): void {
    if (event.value) {
      this.checkexitpackage = true;
      this.parent.unique = event.value.unique;
      const objSelect = this.packageList.find(c => c.id === event.value.package_id);
      if (objSelect) {
        this.parent.packageSelected = objSelect;
        this.dataForm.get('package_id').patchValue(objSelect.id);
        this.dataForm.get('package_no').patchValue(event.value.package_no);
        this.dataForm.get('quantity').patchValue(event.value.quantity);
        this.dataForm.get('gross_weight_in_kg').patchValue(event.value.gross_weight_in_kg);
        this.dataForm.get('total_net_weight').patchValue(event.value.total_net_weight);
        this.dataForm.get('type_of_waste').patchValue(event.value.waste_materials[0].type_of_waste);
        this.dataForm.get('type_of_operation').patchValue(event.value.waste_materials[0].type_of_operation);
        this.dataForm.get('transporter_id').patchValue(event.value.waste_materials[0].transporter_id);
        this.dataForm.get('disposer_id').patchValue(event.value.waste_materials[0].disposer_id);
        this.dataForm.get('manifest_no').patchValue(event.value.waste_materials[0].manifest_no);
        this.dataForm.get('waste_package_id').patchValue(event.value.id);
        this.dataForm.get('qty').patchValue(1);
        if (!this.newPkg && this.currentUser.role === 'contractor') {
          this.dataForm.get('package_no').disable();
          this.dataForm.get('quantity').disable();
        } else {
          this.dataForm.get('package_no').enable();
          this.dataForm.get('quantity').enable();
        }
        this.dataForm.updateValueAndValidity();
      } else {
        this.parent.packageSelected = null;
      }
    }
    if ((!this.newPkg && this.currentUser.role === 'contractor') || this.checkexitpackage) {
      this.dataForm.get('package_id').disable();
    }
  }
  onNewPackageSelect(event: any): void {
    if (event.value) {
      const objSelect = this.packageList.find(c => c.id === event.value);
      if (objSelect) {
        this.parent.packageSelected = objSelect;
        this.dataForm.updateValueAndValidity();
      }
    }
  }

  subCodeChange(event: any): void {
    if (event.value) {
      const obj = this.subCodes.find(c => c.id === event.value);
      if (obj) {
        this.wasteDesc = obj.description;
      } else {
        this.wasteDesc = '';
      }
    }
  }
  createDataForm(): UntypedFormGroup {
    return this._formBuilder.group({
      package_id: [this.setDefaultNull(this.parent.package_id), [Validators.required]],
      waste_package_id: [this.setDefaultNull(this.parent.id)],
      package_no: [this.setDefaultNull(this.parent.package_no)],
      quantity: [this.setDefaultValue(this.parent.quantity, 1)],
      qty: [this.setDefaultValue(this.parent.qty, 1)],
      weight_in_kg: [this.setDefaultNull(this.parent.remain_weight)],
      gross_weight_in_kg: [this.setDefaultNull(this.parent.gross_weight_in_kg), [Validators.required]],
      total_net_weight: [this.setDefaultNull(this.parent.total_net_weight), [Validators.required]],
      type_of_waste: [this.setDefaultValue(this.parent.typeOfWaste, 'Non-Hazardous Waste')],
      type_of_operation: [this.setDefaultNull(this.parent.typeOfOperate?.value), [Validators.required]],
      transporter_id: [this.parent.transporter?.id || null, [(this.parent.wasteType === 'direct' && this.currentUser.role === 'generator') || (this.parent.wasteType === 'transit' && this.currentUser.role === 'moderator') ? Validators.required : Validators.nullValidator]],
      disposer_id: [this.parent.disposer?.id || null, [(this.parent.wasteType === 'direct' && this.currentUser.role === 'generator') || (this.parent.wasteType === 'transit' && this.currentUser.role === 'moderator') ? Validators.required : Validators.nullValidator]],
      manifest_no: [this.parent.manifest_no || null, [(this.parent.wasteType === 'direct' && this.currentUser.role === 'generator') || (this.parent.wasteType === 'transit' && this.currentUser.role === 'moderator') ? Validators.required : Validators.nullValidator]],
      tag: [this.setDefaultNull(this.parent.tag)],
      waste_sub_code_id: [this.setDefaultNull(this.parent.wasteSubCode?.id)]
    });
  }


  removeFile(objArray: any, index: number): void {
    if (objArray && Array.isArray(objArray) && objArray.length > 0) {
      objArray.splice(index, 1);
    }
  }
  addFile(fileType: string): void {
    this._uploadForm = this._matDialog.open(FileUploadComponent, {
      panelClass: 'standard-dialog',
      width: '100%',
      data: { type: fileType }
    });
    this._uploadForm.afterClosed().pipe(takeUntil(this._unsubscribeAll)).subscribe((values) => {
      if (values && Array.isArray(values) && values.length > 0) {
        values.forEach((item) => {
          if (item.file_type === 'Document') {
            this.parent.document.push(item);
          } else {
            this.parent.pictures.push(item);
          }
        });
      }
    });
  }


  toggleNewPkg(): void {
    this.dataForm.get('package_no').patchValue(null);
    this.dataForm.get('quantity').patchValue(1);
    this.dataForm.get('gross_weight_in_kg').patchValue(null);
    this.dataForm.get('total_net_weight').patchValue(null);
    this.dataForm.updateValueAndValidity();
    this.newPkg = !this.newPkg;
  }

  saveData(): void {
    if (!this.dataForm.valid) { return; }
    if (!this.saveDataValidate()) { return; }
    this.parent.uploads = this.setParentUpload(this.parent.uploads);
    if (this.isAllowSave()) {
      if (!this.parent.material_status) { // add new
        this.parent.material_status = this.setMaterialStatus();
        let uploads = [];
        uploads = uploads.concat(this.parent.document);
        uploads = uploads.concat(this.parent.pictures);
        const formData = this.dataForm.getRawValue();
        const material = {
          'waste_package_id': formData.waste_package_id,
          'created_contractor_id': this.currentUser.id,
          'status': this.setWasteStatus(),
          'type_of_operation': formData.type_of_operation,
          'type_of_waste': formData.type_of_waste,
          'weight_in_kg': this.setDefaultValue(formData.weight_in_kg, 0),
          'waste_sub_code_id': this.setDefaultNull(formData.waste_sub_code_id),
          'quantity': this.setDefaultValue(formData.qty, 1),
          'manifest_no': formData.manifest_no,
          'transporter_id': formData.transporter_id,
          'uploads': uploads,
          'tag': this.parent.tag,
          'recycle_benefit': this.parent.recycle_benefit
        };
        this.parent.id = formData.waste_package_id;
        this._splashScreenService.show();
        this.updateWastePackage();
        this._service.createMaterial(material).pipe(take(1)).subscribe(() => {
          this._splashScreenService.hide();
          this.parent.package_id = formData.package_id;
          this.parent.waste_package_id = formData.waste_package_id;
          this.parent.package_no = formData.package_no;
          this.parent.quantity = formData.quantity;
          this.parent.qty = formData.qty;
          this.parent.weight_in_kg = formData.weight_in_kg;
          this.parent.gross_weight_in_kg = formData.gross_weight_in_kg;
          this.parent.total_net_weight = formData.total_net_weight;
          this.parent.type_of_waste = formData.type_of_waste;
          this.parent.type_of_operation = formData.type_of_operation;
          this.parent.transporter_id = formData.transporter_id;
          this.parent.disposer_id = formData.disposer_id;
          this.parent.manifest_no = formData.manifest_no;
          this.parent.tag = formData.tag;
          this.parent.waste_sub_code_id = formData.waste_sub_code_id;
          this.parent.package = this.packageList.find(c => c.id === formData.package_id);
          this.parent.wasteSubCode = this.subCodes.find(c => c.id === formData.waste_sub_code_id);
          this._matDialogRef.close(this.parent);
        });
      }
      else {
        this.updateMaterial();
      }
    }
    else {
      this.setParentValue();
      const formData = this.dataForm.getRawValue();
      this.parent.package_id = formData.package_id;
      this.parent.waste_package_id = formData.waste_package_id;
      this.parent.package_no = formData.package_no;
      this.parent.quantity = formData.quantity;
      this.parent.qty = formData.qty;
      this.parent.weight_in_kg = formData.weight_in_kg;
      this.parent.gross_weight_in_kg = formData.gross_weight_in_kg;
      this.parent.total_net_weight = formData.total_net_weight;
      this.parent.type_of_waste = formData.type_of_waste;
      this.parent.type_of_operation = formData.type_of_operation;
      this.parent.transporter_id = formData.transporter_id;
      this.parent.disposer_id = formData.disposer_id;
      this.parent.manifest_no = formData.manifest_no;
      this.parent.tag = formData.tag;
      this.parent.waste_sub_code_id = formData.waste_sub_code_id;
      this.parent.package = this.packageList.find(c => c.id === formData.package_id);
      this.parent.wasteSubCode = this.subCodes.find(c => c.id === formData.waste_sub_code_id);
      this._matDialogRef.close(this.parent);
    }
  }

  revert(): void {
    this._splashScreenService.show();
    this._service.revertMaterial(this.parent.material_id).pipe(take(1)).subscribe(() => {
      this._splashScreenService.hide();
      Swal.fire('Success', 'Waste material has been revert to \'Verified\' status.', 'success').then(() => {
        this.close();
      });
    });
  }

  transfer(): void {
    this.isTransfer = true;
    if (this.isTransfer && !this.parent.recycle_benefit) { return; }
    let uploads = [];
    uploads = uploads.concat(this.parent.document);
    uploads = uploads.concat(this.parent.pictures);
    const formData = this.dataForm.getRawValue();
    const material = {
      'type_of_operation': formData.type_of_operation,
      'type_of_waste': formData.type_of_waste,
      'waste_sub_code_id': formData.waste_sub_code_id ? formData.waste_sub_code_id : null,
      'disposer_id': formData.disposer_id ? formData.disposer_id : null,
      'transporter_id': formData.transporter_id,
      'manifest_no': formData.manifest_no,
      'quantity': formData.qty || 1,
      'weight_in_kg': formData.weight_in_kg || 0,
      'status': this.parent.material_status || 'Transferred',
      'disposal_records': this.parent.disposal_records,
      'recycle_benefit': this.parent.recycle_benefit,
      'tag': this.parent.tag,
      'created_contractor_id': this.parent.created_contractor_id,
      'uploads': uploads,
    };
    if (formData.weight_in_kg === 0) {
      Swal.fire({
        title: '',
        text: 'Are you sure you want to transfer zero weight?',
        showCancelButton: true,
        icon: 'question',
        confirmButtonText: 'Yes',
        cancelButtonText: 'No'
      }).then((result) => {
        if (result.isConfirmed) {
          this._splashScreenService.show();
          this.updateWastePackage();
          this._service.updateMaterial(this.parent.material_id, material).pipe(take(1)).subscribe(() => {
            this._splashScreenService.hide();
            Swal.fire('Success', 'Waste material has been transferred.', 'success').then(() => {
              this.parent.package_id = formData.package_id;
              this.parent.waste_package_id = formData.waste_package_id;
              this.parent.package_no = formData.package_no;
              this.parent.quantity = formData.quantity;
              this.parent.qty = formData.qty;
              this.parent.weight_in_kg = formData.weight_in_kg;
              this.parent.gross_weight_in_kg = formData.gross_weight_in_kg;
              this.parent.total_net_weight = formData.total_net_weight;
              this.parent.type_of_waste = formData.type_of_waste;
              this.parent.type_of_operation = formData.type_of_operation;
              this.parent.transporter_id = formData.transporter_id;
              this.parent.disposer_id = formData.disposer_id;
              this.parent.manifest_no = formData.manifest_no;
              this.parent.tag = formData.tag;
              this.parent.waste_sub_code_id = formData.waste_sub_code_id;
              this.parent.package = this.packageList.find(c => c.id === formData.package_id);
              this.parent.wasteSubCode = this.subCodes.find(c => c.id === formData.waste_sub_code_id);
              this._matDialogRef.close(this.parent);
            });
          });
        }
      });
    } else {
      this._splashScreenService.show();
      this.updateWastePackage();
      this._service.updateMaterial(this.parent.material_id, material).pipe(take(1)).subscribe(() => {
        this._splashScreenService.hide();
        Swal.fire('Success', 'Waste material has been transferred.', 'success').then(() => {
          this.parent.package_id = formData.package_id;
          this.parent.waste_package_id = formData.waste_package_id;
          this.parent.package_no = formData.package_no;
          this.parent.quantity = formData.quantity;
          this.parent.qty = formData.qty;
          this.parent.weight_in_kg = formData.weight_in_kg;
          this.parent.gross_weight_in_kg = formData.gross_weight_in_kg;
          this.parent.total_net_weight = formData.total_net_weight;
          this.parent.type_of_waste = formData.type_of_waste;
          this.parent.type_of_operation = formData.type_of_operation;
          this.parent.transporter_id = formData.transporter_id;
          this.parent.disposer_id = formData.disposer_id;
          this.parent.manifest_no = formData.manifest_no;
          this.parent.tag = formData.tag;
          this.parent.waste_sub_code_id = formData.waste_sub_code_id;
          this.parent.package = this.packageList.find(c => c.id === formData.package_id);
          this.parent.wasteSubCode = this.subCodes.find(c => c.id === formData.waste_sub_code_id);
          this._matDialogRef.close(this.parent);
        });
      });
    }
  }
  updateAll(): void {
    this.parent.updateAll = true;
    const formData = this.dataForm.getRawValue();
    this.parent.package_id = formData.package_id;
    this.parent.waste_package_id = formData.waste_package_id;
    this.parent.package_no = formData.package_no;
    this.parent.quantity = formData.quantity;
    this.parent.qty = formData.qty;
    this.parent.weight_in_kg = formData.weight_in_kg;
    this.parent.gross_weight_in_kg = formData.gross_weight_in_kg;
    this.parent.total_net_weight = formData.total_net_weight;
    this.parent.type_of_waste = formData.type_of_waste;
    this.parent.type_of_operation = formData.type_of_operation;
    this.parent.transporter_id = formData.transporter_id;
    this.parent.disposer_id = formData.disposer_id;
    this.parent.manifest_no = formData.manifest_no;
    this.parent.tag = formData.tag;
    this.parent.waste_sub_code_id = formData.waste_sub_code_id;
    this.parent.package = this.packageList.find(c => c.id === formData.package_id);
    this.parent.wasteSubCode = this.subCodes.find(c => c.id === formData.waste_sub_code_id);
    this._matDialogRef.close(this.parent);
  }

  updateWastePackage(): void {
    const formData = this.dataForm.getRawValue();
    if (this.parent.id || formData.package_id) {
      const pkg = {
        'unique': this.parent.unique,
        'package_id': (this.parent.id ? this.parent.id : formData.package_id),
        'package_no': formData.package_no,
        'quantity': formData.quantity,
        'gross_weight_in_kg': formData.gross_weight_in_kg,
        'total_net_weight': formData.total_net_weight
      };

      this._service.updatePackage((this.parent.id ? this.parent.id : formData.package_id), pkg).pipe(take(1)).subscribe(() => { });
    }
  }
  close(): void {
    this._matDialogRef.close();
  }
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }

  private setDefaultNull(value: any): any {
    return value ? value : null;
  }
  private setDefaultValue(value: any, defaultData: any): any {
    return value ? value : defaultData;
  }
  private saveDataValidate(): boolean {
    if (this.parent.pre_disposal === 'yes' && !this.checkDisposer()) {
      return false;
    }

    if (this.formTitle.toUpperCase() === 'DISPOSAL INFORMATION' && !this.parent.uploads.length) {
      return false;
    }

    return true;
  }

  private checkDisposer(): boolean {
    if ((!this.parent.disposer1Selected || !this.parent.disposalCode1Selected)
      && (!this.parent.disposer2Selected || !this.parent.disposalCode2Selected)
      && (!this.parent.disposer3Selected || !this.parent.disposalCode3Selected)) {
      return false;
    }

    // check select a couple of disposer.
    if ((this.parent.disposer1Selected && !this.parent.disposalCode1Selected)
      || (this.parent.disposer2Selected && !this.parent.disposalCode2Selected)
      || (this.parent.disposer3Selected && !this.parent.disposalCode3Selected)) {
      return false;
    }
    return true;
  }
  private setParentUpload(fdata: any): any {
    if (this.parent.document && this.parent.pictures) {
      fdata = this.parent.document.concat(this.parent.pictures);
    }
    return fdata;
  }

  private isAllowSave(): boolean {
    if ((this.currentUser.role === 'contractor' || this.currentUser.role === 'administrator') && this.parent.hasOwnProperty('wasteStatus') &&
      this.formTitle.toUpperCase() !== 'DISPOSAL INFORMATION' && this.formTitle.toUpperCase() !== 'CONFIRM' && !this.parent.isDelete) {
      return true;
    }
    else {
      return false;
    }
  }
  private setMaterialStatus(): any {
    if (this.currentUser.role === 'administrator' && this.parent.wasteStatus.toLowerCase() !== 'draft') {
      return this.parent.wasteStatus;
    }
    else {
      return 'Verified';
    }
  }

  private setWasteStatus(): any {
    if (this.currentUser.role === 'administrator') {
      return this.parent.wasteStatus;
    }
    else {
      return 'Verified';
    }
  }

  private setParentValue(): any{
    if (this.parent.hasOwnProperty('confirm')) {
      this.parent.confirm = true;
    }
    if (this.parent.oremark === null) {
      this.parent.oremark = this.parent.remark;
    }
    else {
      this.parent.oremark = this.parent.remark + '\r\n' + this.parent.oremark;
    }
  }

  private updateMaterial(): void {
    let uploads = [];
    uploads = uploads.concat(this.parent.document);
    uploads = uploads.concat(this.parent.pictures);
    if (this.parent.material_id) { // has material id update to service
      this.parent.status = this.parent.material_status;
      const formData = this.dataForm.getRawValue();
      const material = {
        'type_of_operation': formData.type_of_operation,
        'type_of_waste': formData.type_of_waste,
        'waste_sub_code_id': formData.waste_sub_code_id ? formData.waste_sub_code_id : null,
        'disposer_id': formData.disposer_id ? formData.disposer_id : null,
        'transporter_id': formData.transporter_id,
        'manifest_no': formData.manifest_no,
        'quantity': this.setDefaultValue(formData.qty,1),
        'weight_in_kg': this.setDefaultValue(formData.weight_in_kg,0),
        'status': this.setDefaultValue(this.parent.material_status,'Verified'),
        'disposal_records': this.parent.disposal_records,
        'recycle_benefit': this.parent.recycle_benefit,
        'tag': this.parent.tag,
        'created_contractor_id': this.parent.created_contractor_id,
        'uploads': uploads,
      };


      if (formData.weight_in_kg === 0) {
        Swal.fire({
          title: '',
          text: 'Are you sure you want to set weight to zero?',
          showCancelButton: true,
          icon: 'question',
          confirmButtonText: 'Yes',
          cancelButtonText: 'No'
        }).then((result) => {
          if (result.isConfirmed) {
            this._splashScreenService.show();
            this.updateWastePackage();
            this._service.updateMaterial(this.parent.material_id, material).pipe(take(1)).subscribe(() => {
              this._splashScreenService.hide();
              this.parent.package_id = formData.package_id;
              this.parent.waste_package_id = formData.waste_package_id;
              this.parent.package_no = formData.package_no;
              this.parent.quantity = formData.quantity;
              this.parent.qty = formData.qty;
              this.parent.weight_in_kg = formData.weight_in_kg;
              this.parent.gross_weight_in_kg = formData.gross_weight_in_kg;
              this.parent.total_net_weight = formData.total_net_weight;
              this.parent.type_of_waste = formData.type_of_waste;
              this.parent.type_of_operation = formData.type_of_operation;
              this.parent.transporter_id = formData.transporter_id;
              this.parent.disposer_id = formData.disposer_id;
              this.parent.manifest_no = formData.manifest_no;
              this.parent.tag = formData.tag;
              this.parent.waste_sub_code_id = formData.waste_sub_code_id;
              this.parent.package = this.packageList.find(c => c.id === formData.package_id);
              this.parent.wasteSubCode = this.subCodes.find(c => c.id === formData.waste_sub_code_id);
              this._matDialogRef.close(this.parent);
            });
          }
        });
      } else {
        this._splashScreenService.show();
        this.updateWastePackage();
        this._service.updateMaterial(this.parent.material_id, material).pipe(take(1)).subscribe(() => {
          this._splashScreenService.hide();
          this.parent.package_id = formData.package_id;
          this.parent.waste_package_id = formData.waste_package_id;
          this.parent.package_no = formData.package_no;
          this.parent.quantity = formData.quantity;
          this.parent.qty = formData.qty;
          this.parent.weight_in_kg = formData.weight_in_kg;
          this.parent.gross_weight_in_kg = formData.gross_weight_in_kg;
          this.parent.total_net_weight = formData.total_net_weight;
          this.parent.type_of_waste = formData.type_of_waste;
          this.parent.type_of_operation = formData.type_of_operation;
          this.parent.transporter_id = formData.transporter_id;
          this.parent.disposer_id = formData.disposer_id;
          this.parent.manifest_no = formData.manifest_no;
          this.parent.tag = formData.tag;
          this.parent.waste_sub_code_id = formData.waste_sub_code_id;
          this.parent.package = this.packageList.find(c => c.id === formData.package_id);
          this.parent.wasteSubCode = this.subCodes.find(c => c.id === formData.waste_sub_code_id);
          this._matDialogRef.close(this.parent);
        });
      }
    } else {
      const formData = this.dataForm.getRawValue();
      this.parent.package_id = formData.package_id;
      this.parent.waste_package_id = formData.waste_package_id;
      this.parent.package_no = formData.package_no;
      this.parent.quantity = formData.quantity;
      this.parent.qty = formData.qty;
      this.parent.weight_in_kg = formData.weight_in_kg;
      this.parent.gross_weight_in_kg = formData.gross_weight_in_kg;
      this.parent.total_net_weight = formData.total_net_weight;
      this.parent.type_of_waste = formData.type_of_waste;
      this.parent.type_of_operation = formData.type_of_operation;
      this.parent.transporter_id = formData.transporter_id;
      this.parent.disposer_id = formData.disposer_id;
      this.parent.manifest_no = formData.manifest_no;
      this.parent.tag = formData.tag;
      this.parent.waste_sub_code_id = formData.waste_sub_code_id;
      this.parent.package = this.packageList.find(c => c.id === formData.package_id);
      this.parent.wasteSubCode = this.subCodes.find(c => c.id === formData.waste_sub_code_id);
      this._matDialogRef.close(this.parent);
    }
  }
}

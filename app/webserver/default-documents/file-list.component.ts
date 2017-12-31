﻿import { Component, OnInit, OnDestroy, SimpleChange, Input, Output, EventEmitter } from '@angular/core';

import { DiffUtil } from '../../utils/diff';
import { OrderBy } from '../../common/sort.pipe';

import { File } from './default-documents';
import { DefaultDocumentsService } from './default-documents.service';

@Component({
    selector: 'file',
    template: `        
        <div *ngIf="model" class="grid-item row" [class.background-editing]="_editing">
            <div class="actions">
                <button class="no-border no-editing" [class.inactive]="readonly" title="编辑" (click)="onEdit()">
                    <i class="fa fa-pencil color-active"></i>
                </button>
                <button class="no-border editing" [disabled]="!isValid(file)" title="确认" (click)="onOk()">
                    <i class="fa fa-check color-active"></i>
                </button>
                <button class="no-border editing" title="取消" (click)="onCancel()">
                    <i class="fa fa-times red"></i>
                </button>
                <button class="no-border" title="删除" [class.inactive]="readonly" (click)="onDelete()">
                    <i class="fa fa-trash-o red"></i>
                </button>
            </div>
            <fieldset class="col-xs-8">
                <input *ngIf="_editing" class="form-control" type="text" [(ngModel)]="model.name" required />
                <span *ngIf="!_editing" class="form-control">{{model.name}}</span>
            </fieldset>
        </div>
    `,
    styles: [`
        .grid-item fieldset {
            padding-top: 0;
            padding-bottom: 0;
            padding-right: 0;
        }
    `]
})
export class FileListItem {
    @Input() model: File;
    @Input() readonly: boolean;
    @Output() edit: EventEmitter<any> = new EventEmitter();
    @Output() close: EventEmitter<any> = new EventEmitter();

    private _original: File;
    private _editing: boolean;


    constructor(private _service: DefaultDocumentsService) {
    }

    ngOnInit() {
        this._original = JSON.parse(JSON.stringify(this.model));

        if (this.model && !this.model.id) {
            this._editing = true;
        }
    }

    ngOnChanges(changes: { [key: string]: SimpleChange; }): any {

        if (changes["file"]) {
            this._original = JSON.parse(JSON.stringify(changes["file"].currentValue));
        }
    }

    onEdit() {
        this._editing = true;
        this.edit.emit(null);
    }

    onOk() {
        if (!this.isValid()) {
            return;
        }

        if (this.model.id) {
            //
            // Update
            var changes = DiffUtil.diff(this._original, this.model);

            if (Object.keys(changes).length > 0) {
                this._service.updateFile(this.model, changes).then(_ => {
                    this.set(this.model);
                    this.hide();
                })
            }
            else {
                this.hide();
            }
        }
        else {
            //
            // Create new
            this._service.addFile(this.model).then(_ => {
                this.set(this.model);
                this.hide();
            });
        }
    }

    onCancel() {
        //
        // Revert changes
        let original = JSON.parse(JSON.stringify(this._original));

        for (var k in original) this.model[k] = original[k];

        this.hide();
    }

    private onDelete() {
        if (this.model.id) {
            this._service.deleteFile(this.model);
        }

        this.hide();
    }

    private isValid(): boolean {
        return !!this.model.name;
    }

    private set(file: File) {
        this._original = JSON.parse(JSON.stringify(file));
    }

    private hide() {
        this._editing = false;
        this.close.emit(null);
    }
}


@Component({
    selector: 'files',
    template: `
        <div>
            <button class="create" (click)="add()" [class.inactive]="_editing"><i class="fa fa-plus color-active"></i><span>添加</span></button>
            <div *ngIf="_files">
                <div class="col-sm-6 col-lg-4">
                    <div class="row hidden-xs border-active grid-list-header" [hidden]="_files.length < 1">
                        <label [ngClass]="_orderBy.css('name')" (click)="_orderBy.sort('name')">文件名称</label>
                    </div>
                    <div class="grid-list">
                        <file *ngIf="_newFile" [model]="_newFile" (close)="close()"></file>
                        <file *ngFor="let f of _files | orderby: _orderBy.Field: _orderBy.Asc" 
                                        [model]="f" 
                                        [readonly]="_editing && f != _editing"
                                        (edit)="edit(f)" (close)="close()">
                        </file>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class FileListComponent implements OnInit, OnDestroy {
    private _files: Array<File>;
    private _editing: File;
    private _newFile: File;
    private _orderBy: OrderBy = new OrderBy();
    private _subs = [];


    constructor(private _service: DefaultDocumentsService) {
    }

    ngOnInit() {
        this._subs.push(this._service.files.subscribe(files => {
            this._files = [];
            if (files) {
                files.forEach(f => this._files.push(f));
            }
        }));
    }

    ngOnDestroy() {
        this._subs.forEach(s => s.unsubscribe());
    }

    private add() {
        this._newFile = new File();
        this._newFile.name = "";

        this._editing = this._newFile;
    }

    private edit(file: File) {
        this._editing = file;
    }

    private close() {
        this._newFile = this._editing = null;
    }
}

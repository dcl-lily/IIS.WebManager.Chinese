﻿import { Component, OnChanges, EventEmitter, Input, Output, SimpleChange } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

import { NotificationService } from '../../../notification/notification.service';
import { UrlRewriteService } from '../service/url-rewrite.service';
import { InboundRule, ActionTypeHelper } from '../url-rewrite';

@Component({
    selector: 'inbound-rule',
    template: `
        <div *ngIf="rule" class="grid-item row" [class.background-selected]="_editing" (dblclick)="edit()">
            <div class="col-xs-8 col-sm-3 valign">
                <span class="pointer" (click)="edit()">{{rule.name}}</span>
            </div>
            <div class="visible-lg col-lg-2 valign">
                {{toFriendlyActionType(rule.action.type)}}
            </div>
            <div class="hidden-xs col-sm-3 col-lg-2 valign">
                {{rule.pattern}}
            </div>
            <div class="hidden-xs col-sm-4 valign">
                <span *ngIf="rule.action.type == 'redirect' || rule.action.type == 'rewrite'">{{rule.action.url}}</span>
            </div>
            <div class="actions">
                <div class="action-selector">
                    <button title="More" (click)="selector.toggle()" (dblclick)="$event.preventDefault()" [class.background-active]="(selector && selector.opened) || _editing || false">
                        <i class="fa fa-ellipsis-h"></i>
                    </button>
                    <selector #selector [right]="true">
                        <ul>
                            <li><button #menuButton class="edit" title="编辑" (click)="edit()">Edit</button></li>
                            <li><button #menuButton class="up" title="向上" (click)="_service.moveInboundUp(rule)">Move Up</button></li>
                            <li><button #menuButton class="down" title="向下" (click)="_service.moveInboundDown(rule)">Move Down</button></li>
                            <li><button #menuButton class="copy" title="复制" (click)="_service.copyInboundRule(rule)">Clone</button></li>
                            <li><button #menuButton class="delete" title="删除" (click)="delete()">Delete</button></li>
                        </ul>
                    </selector>
                </div>
            </div>
        </div>
        <selector #editSelector [opened]="true" *ngIf="_editing" class="container-fluid" (hide)="discard()">
            <inbound-rule-edit [rule]="rule" (save)="save($event)" (cancel)="discard()"></inbound-rule-edit>
        </selector>
    `
})
export class InboundRuleComponent implements OnChanges {
    @Input() public rule: InboundRule;
    @Output('delete') deleteEvent: EventEmitter<any> = new EventEmitter<any>();

    private _editing: boolean = false;
    private toFriendlyActionType: Function = ActionTypeHelper.toFriendlyActionType;
    private _original: InboundRule;

    constructor(private _service: UrlRewriteService, private _notificationService: NotificationService) {
    }

    ngOnChanges(changes: { [key: string]: SimpleChange; }): any {
        if (changes["rule"]) {
            this._original = JSON.parse(JSON.stringify(changes["rule"].currentValue));
        }
    }

    private edit() {
        this._editing = true;
    }

    private delete() {
        this._notificationService.confirm("删除入站规则", "你确认要删除 '" + this.rule.name + "'?")
            .then(confirmed => confirmed && this._service.deleteInboundRule(this.rule));
    }

    private save() {
        this._service.saveInboundRule(this.rule)
            .then(() => this._original = JSON.parse(JSON.stringify(this.rule)));
        this._editing = false;
    }

    private discard() {
        this.rule = JSON.parse(JSON.stringify(this._original));
        this._editing = false;
    }
}
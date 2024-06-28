// src/app/directives/decimal-validator.directive.ts
import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
	selector: '[appDecimalValidator]'
})

export class DecimalValidatorDirective {
	private regex: RegExp = new RegExp(/^\d*\.?\d*$/g);
	private specialKeys: Array<string> = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete', 'F5'];

	readonly ALL_STR_ID = "(All)";
	constructor(private el: ElementRef, private control: NgControl) { }

	@HostListener('focus')
	onFocus() {
		if (this.el.nativeElement.value === this.ALL_STR_ID) {
			this.el.nativeElement.value = '';
			this.control.control?.setValue('');
		}
	}

	@HostListener('blur')
	onBlur() {
		if (this.el.nativeElement.value === '') {
			this.el.nativeElement.value = this.ALL_STR_ID;
			this.control.control?.setValue(this.ALL_STR_ID);
		}
	}

	@HostListener('keydown', ['$event'])
	onKeyDown(event: KeyboardEvent) {
		console.log(event.key);
		// Allow special keys
		if (this.specialKeys.indexOf(event.key) !== -1) {
			return;
		}

		// Clear the field if it contains the default value
		if (this.el.nativeElement.value === this.ALL_STR_ID) {
			this.el.nativeElement.value = '';
			this.control.control?.setValue('');
		}

		// Prevent invalid keys
		const current: string = this.el.nativeElement.value;
		const next: string = current.concat(event.key);
		if (next && !String(next).match(this.regex)) {
			event.preventDefault();
		}
	}

	@HostListener('paste', ['$event'])
	blockPaste(event: ClipboardEvent) {
		let clipboardData = event.clipboardData || (window as any).clipboardData;
		let pastedText = clipboardData.getData('text');
		if (pastedText && !String(pastedText).match(this.regex)) {
			event.preventDefault();
		}
	}
}


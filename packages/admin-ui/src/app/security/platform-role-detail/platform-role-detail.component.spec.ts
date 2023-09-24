import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PlatformRoleDetailComponent} from 'src/app/security/platform-role-detail/platform-role-detail.component';

describe('PlatformRoleDetailComponent', () => {
	let component: PlatformRoleDetailComponent;
	let fixture: ComponentFixture<PlatformRoleDetailComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [PlatformRoleDetailComponent]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PlatformRoleDetailComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});

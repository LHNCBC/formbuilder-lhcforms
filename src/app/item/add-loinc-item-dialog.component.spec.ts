import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLoincItemDialogComponent } from './add-loinc-item-dialog.component';
import { CommonTestingModule, runOnPushChangeDetection } from '../testing/common-testing.module';
import { AutoCompleteLoincItem, LoincItemType } from '../services/fetch.service';

describe('AddLoincItemDialogComponent', () => {
  let component: AddLoincItemDialogComponent;
  let fixture: ComponentFixture<AddLoincItemDialogComponent>;

  // A LOINC panel search result.
  const panelItem: AutoCompleteLoincItem = {
    LOINC_NUM: '34565-2',
    text: 'Vital signs, weight and height panel'
  };

  // A LOINC question search result with multiple distinct display-text candidates.
  const questionItem: AutoCompleteLoincItem = {
    LOINC_NUM: '18833-4',
    text: 'First Body weight',
    COMPONENT: 'Body weight',
    LONG_COMMON_NAME: 'First Body weight measured',
    SHORTNAME: 'Body wt'
  };

  CommonTestingModule.setUpTestBed(AddLoincItemDialogComponent);

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLoincItemDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with Panel as the default type and no selection', () => {
    expect(component).toBeTruthy();
    expect(component.loincType).toBe(LoincItemType.PANEL);
    expect(component.loincItem).toBeUndefined();
  });

  it('should preserve the selected Panel item when toggling item types back and forth', () => {
    component.onSelectLoincItem(panelItem);
    expect(component.loincItem).toBe(panelItem);

    // Switching to Question must not carry over the Panel selection.
    component.onLoincTypeChange(LoincItemType.QUESTION);
    expect(component.loincType).toBe(LoincItemType.QUESTION);
    expect(component.loincItem).toBeFalsy();

    // Switching back to Panel must restore the previously selected panel.
    component.onLoincTypeChange(LoincItemType.PANEL);
    expect(component.loincType).toBe(LoincItemType.PANEL);
    expect(component.loincItem).toBe(panelItem);
  });

  it('should preserve the Question selection, its display texts and chosen display field across toggles', () => {
    component.onLoincTypeChange(LoincItemType.QUESTION);
    component.onSelectLoincItem(questionItem);

    expect(component.loincItem).toBe(questionItem);
    expect(Object.keys(component.loincItemDisplayTexts).length).toBeGreaterThan(1);

    // Simulate the user picking a non-default display field.
    component.selectedDisplayField = 'COMPONENT';

    // Toggle to Panel: the question-specific state should clear from the active bindings.
    component.onLoincTypeChange(LoincItemType.PANEL);
    expect(component.loincItem).toBeFalsy();
    expect(component.loincItemDisplayTexts).toEqual({});
    expect(component.selectedDisplayField).toBe('text');

    // Toggle back to Question: the full question selection should be restored.
    component.onLoincTypeChange(LoincItemType.QUESTION);
    expect(component.loincItem).toBe(questionItem);
    expect(component.selectedDisplayField).toBe('COMPONENT');
    expect(component.loincItemDisplayTexts).toEqual({
      text: 'First Body weight',
      COMPONENT: 'Body weight',
      LONG_COMMON_NAME: 'First Body weight measured',
      SHORTNAME: 'Body wt'
    });
  });

  it('should keep independent selections for Panel and Question at the same time', () => {
    // Select a panel under the default Panel type.
    component.onSelectLoincItem(panelItem);

    // Switch to Question and select a question.
    component.onLoincTypeChange(LoincItemType.QUESTION);
    component.onSelectLoincItem(questionItem);

    // Each type retains its own selection when toggled.
    component.onLoincTypeChange(LoincItemType.PANEL);
    expect(component.loincItem).toBe(panelItem);

    component.onLoincTypeChange(LoincItemType.QUESTION);
    expect(component.loincItem).toBe(questionItem);
  });

  it('should be a no-op when the selected type does not change', () => {
    component.onSelectLoincItem(panelItem);

    component.onLoincTypeChange(LoincItemType.PANEL);

    expect(component.loincType).toBe(LoincItemType.PANEL);
    expect(component.loincItem).toBe(panelItem);
  });

  it('should update the selected type and preserve the selection when the radio group changes', async () => {
    component.onSelectLoincItem(panelItem);
    const onChangeSpy = spyOn(component, 'onLoincTypeChange').and.callThrough();

    const radios: HTMLInputElement[] =
      Array.from(fixture.nativeElement.querySelectorAll('input[type="radio"][name="loincType"]'));
    expect(radios.length).toBe(2);

    // Index 1 corresponds to the 'Question' option (order matches loincTypeOpts).
    radios[1].click();
    await runOnPushChangeDetection(fixture);

    expect(onChangeSpy).toHaveBeenCalledWith(LoincItemType.QUESTION);
    expect(component.loincType).toBe(LoincItemType.QUESTION);
    expect(component.loincItem).toBeFalsy();

    // Switching back to Panel restores the previously selected panel.
    radios[0].click();
    await runOnPushChangeDetection(fixture);

    expect(component.loincType).toBe(LoincItemType.PANEL);
    expect(component.loincItem).toBe(panelItem);
  });

  describe('Add button enablement', () => {
    // Locate the dialog's Add button in the rendered footer.
    const getAddButton = (): HTMLButtonElement =>
      (Array.from(fixture.nativeElement.querySelectorAll('.modal-footer button')) as HTMLButtonElement[])
        .find((btn) => btn.textContent?.trim() === 'Add') as HTMLButtonElement;

    it('should report canAddLoincItem based on whether an item is selected', () => {
      expect(component.canAddLoincItem).toBeFalse();

      component.onSelectLoincItem(panelItem);
      expect(component.canAddLoincItem).toBeTrue();
    });

    it('should disable the Add button until a LOINC item is selected', async () => {
      const addButton = getAddButton();
      expect(addButton).toBeTruthy();
      expect(addButton.disabled).toBeTrue();

      // Selecting an item enables the button.
      component.onSelectLoincItem(panelItem);
      await runOnPushChangeDetection(fixture);
      expect(getAddButton().disabled).toBeFalse();
    });

    it('should disable the Add button again after switching to a type with no selection', async () => {
      component.onSelectLoincItem(panelItem);
      await runOnPushChangeDetection(fixture);
      expect(getAddButton().disabled).toBeFalse();

      // Switching to Question (no prior selection) should disable it again.
      component.onLoincTypeChange(LoincItemType.QUESTION);
      await runOnPushChangeDetection(fixture);
      expect(getAddButton().disabled).toBeTrue();

      // Switching back to Panel restores the selection and re-enables it.
      component.onLoincTypeChange(LoincItemType.PANEL);
      await runOnPushChangeDetection(fixture);
      expect(getAddButton().disabled).toBeFalse();
    });
  });
});



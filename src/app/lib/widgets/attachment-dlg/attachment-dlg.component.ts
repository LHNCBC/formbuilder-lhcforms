import {Component, ElementRef, inject, ViewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatTooltip} from '@angular/material/tooltip';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import fhir from 'fhir/r5';
import {AttachmentUtil} from '../../attachment-util';
import {FhirService} from '../../../services/fhir.service';
import {MessageDlgComponent, MessageType} from '../message-dlg/message-dlg.component';
import {DialogData} from '../table-edit-row-in-dlg/table-edit-row-in-dlg.component';
import {RestrictionsValueComponent} from '../restrictions-value/restrictions-value.component';
import {ISchema, SchemaFormModule} from '@lhncbc/ngx-schema-form';
import {Util} from '../../util';

export type AttachmentInputMethod = 'file' | 'url';

interface AttachmentMethodState {
  attachment: fhir.Attachment;
  dataError: string;
  fileError: string;
  calculatingDataMetadata: boolean;
  formValid: boolean;
  dataRevision: number;
}

@Component({
  selector: 'lfb-attachment-dlg',
  imports: [
    FormsModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatIconButton,
    MatIconModule,
    MatTooltip,
    SchemaFormModule
  ],
  templateUrl: './attachment-dlg.component.html',
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; min-height: 0; }
    .attachment-dlg-container { display: flex; flex: 1 1 auto; flex-direction: column; min-height: 0; }
    .dlg-content { flex: 1 1 auto; max-height: none; min-height: 0; }
    .close-button { float: right; }
    .attachment-field-row {
      border-bottom: lightgrey solid 1px;
      padding: 2px 0;
    }
    .attachment-field-row:hover {
      background-color: lightgoldenrodyellow;
    }
    :host ::ng-deep .attachment-metadata-form sf-form-object > fieldset > div {
      border-bottom: lightgrey solid 1px;
      padding: 2px 0;
    }
    :host ::ng-deep .attachment-metadata-form sf-form-object > fieldset > div:hover {
      background-color: lightgoldenrodyellow;
    }
    :host ::ng-deep .attachment-metadata-form input[name="size"][readonly] {
      background-color: #e9ecef;
      opacity: 1;
    }
  `]
})
export class AttachmentDlgComponent {
  private static readonly CONTENT_METADATA_FIELDS: readonly string[] = [
    'contentType', 'language', 'size', 'hash', 'creation',
    'height', 'width', 'frames', 'duration', 'pages'
  ];

  data = inject<DialogData>(MAT_DIALOG_DATA);
  matDialogRef = inject(MatDialogRef<AttachmentDlgComponent>);
  ngbModalService = inject(NgbModal);
  fhirService = inject(FhirService);

  @ViewChild('dlgContent', {read: ElementRef}) dlgContent: ElementRef;
  @ViewChild('fileInput', {read: ElementRef}) fileInput: ElementRef<HTMLInputElement>;
  inputMethod: AttachmentInputMethod;
  dirty = false;
  attachmentSchema: ISchema;
  readonly attachmentValidators = {
    '/url': (value: string) => this.validationError(!!value && /\s/.test(value),
      'URL_WHITESPACE', 'Whitespace is not allowed in a URL.'),
    '/contentType': (value: string) => {
      if(this.draft.data && !value?.trim()) {
        return this.validationError(true, 'CONTENT_TYPE_REQUIRED',
          'Mime Type is required when attachment data is embedded.');
      }
      return this.validationError(
        !!value && !this.fhirService.isValidMimeType(value),
        'INVALID_MIME_TYPE', 'Enter a valid IANA-registered MIME type.');
    },
    '/language': (value: string) => this.validationError(
      !!value && !AttachmentUtil.isValidLanguageTag(value),
      'INVALID_LANGUAGE', 'Enter a valid BCP-47 language tag, such as en, en-US, or zh-Hant-TW.'),
    '/size': (value: string) => this.validationError(
      !!value && (!/^(0|[1-9][0-9]*)$/.test(value) || value.length > 19 ||
        (value.length === 19 && value > '9223372036854775807')),
      'INVALID_INTEGER64', 'Enter a whole byte count from 0 through 9223372036854775807.')
  };
  private readonly methodStates: Record<AttachmentInputMethod, AttachmentMethodState> = {
    file: this.createMethodState(),
    url: this.createMethodState()
  };

  /** Initialize the selected Attachment row using its saved method or content. */
  constructor() {
    const rowValue = this.data.rowIndex >= 0
      ? this.data.arrayProperty.properties[this.data.rowIndex]?.value
      : null;
    const attachment = rowValue?.valueAttachment || {};
    const savedMethod = rowValue?.__$attachmentInputMethod;
    this.inputMethod = savedMethod === 'file' || savedMethod === 'url' ? savedMethod :
      (attachment.data ? 'file' : attachment.url ? 'url' : 'file');
    this.draft = JSON.parse(JSON.stringify(attachment));
    this.attachmentSchema = this.createAttachmentSchema();
    if(attachment.data) {
      this.initializeDataMetadata(attachment.data, this.activeState);
    }
  }

  /**
   * Return the Attachment draft for the active input method.
   * @returns The active input method's Attachment draft.
   */
  get draft(): fhir.Attachment {
    return this.activeState.attachment;
  }

  /**
   * Replace the Attachment draft for the active input method.
   * @param value - The replacement Attachment draft.
   */
  set draft(value: fhir.Attachment) {
    this.activeState.attachment = value;
  }

  /**
   * Return the base64 validation error for the active input method.
   * @returns The current base64 validation message, or an empty string when valid.
   */
  get dataError(): string {
    return this.activeState.dataError;
  }

  /**
   * Set the base64 validation error for the active input method.
   * @param value - The validation message, or an empty string to clear it.
   */
  set dataError(value: string) {
    this.activeState.dataError = value;
  }

  /**
   * Return the file-reading error for the active input method.
   * @returns The current file-reading error, or an empty string when no error exists.
   */
  get fileError(): string {
    return this.activeState.fileError;
  }

  /**
   * Set the file-reading error for the active input method.
   * @param value - The file-reading error, or an empty string to clear it.
   */
  set fileError(value: string) {
    this.activeState.fileError = value;
  }

  /**
   * Return whether attachment data metadata is being calculated.
   * @returns True while size and hash metadata are being calculated.
   */
  get calculatingDataMetadata(): boolean {
    return this.activeState.calculatingDataMetadata;
  }

  /**
   * Set whether attachment data metadata is being calculated.
   * @param value - True while metadata calculation is in progress.
   */
  set calculatingDataMetadata(value: boolean) {
    this.activeState.calculatingDataMetadata = value;
  }

  /**
   * Return whether the shared Attachment metadata form is valid.
   * @returns True when the metadata form is valid.
   */
  get attachmentFormValid(): boolean {
    return this.activeState.formValid;
  }

  /**
   * Set whether the shared Attachment metadata form is valid.
   * @param value - The latest validity state emitted by the metadata form.
   */
  set attachmentFormValid(value: boolean) {
    this.activeState.formValid = value;
  }

  /**
   * Return whether the current content type is not an IANA-registered MIME type.
   * @returns True when a populated content type is invalid.
   */
  get mimeTypeInvalid(): boolean {
    return !!this.draft.contentType && !this.fhirService.isValidMimeType(this.draft.contentType);
  }

  /**
   * Return whether embedded Attachment data violates the FHIR att-1 invariant.
   * @returns True when embedded data has no content type.
   */
  get embeddedDataContentTypeMissing(): boolean {
    return !!this.draft.data && !this.draft.contentType?.trim();
  }

  /**
   * Return whether the current URL contains invalid whitespace.
   * @returns True when a populated URL contains whitespace.
   */
  get urlInvalid(): boolean {
    return !!this.draft.url && /\s/.test(this.draft.url);
  }

  /**
   * Return whether the current language is not a well-formed BCP-47 tag.
   * @returns True when a populated language tag is invalid.
   */
  get languageInvalid(): boolean {
    return !!this.draft.language && !AttachmentUtil.isValidLanguageTag(this.draft.language);
  }

  /**
   * Return whether a populated R5 Attachment.size is not a non-negative integer64.
   * @returns True when the populated size is outside the FHIR integer64 range.
   */
  get sizeInvalid(): boolean {
    const value = this.draft.size;
    if(value === undefined || value === null || value === '') {
      return false;
    }
    return !/^(0|[1-9][0-9]*)$/.test(value) || value.length > 19 ||
      (value.length === 19 && value > '9223372036854775807');
  }

  /**
   * Return whether a value is outside the FHIR positiveInt range.
   * @param value - The numeric value to validate, or undefined when absent.
   * @returns True when the populated value is outside the positiveInt range.
   */
  positiveIntegerInvalid(value: number | undefined): boolean {
    return value !== undefined && value !== null &&
      (!Number.isInteger(value) || value < 1 || value > 2147483647);
  }

  /**
   * Return whether a duration is not a finite, non-negative number of seconds.
   * @param value - The duration to validate, or undefined when absent.
   * @returns True when the populated duration is invalid.
   */
  durationInvalid(value: number | undefined): boolean {
    return value !== undefined && value !== null && (!Number.isFinite(value) || value < 0);
  }

  /**
   * Return whether any active Attachment field is invalid or still being processed.
   * @returns True when saving the active Attachment must be prevented.
   */
  get isInvalid(): boolean {
    return !!this.dataError || !!this.fileError || this.calculatingDataMetadata ||
      this.embeddedDataContentTypeMissing || this.mimeTypeInvalid || this.urlInvalid ||
      this.languageInvalid || this.sizeInvalid ||
      this.positiveIntegerInvalid(this.draft.height) || this.positiveIntegerInvalid(this.draft.width) ||
      this.positiveIntegerInvalid(this.draft.frames) || this.positiveIntegerInvalid(this.draft.pages) ||
      this.durationInvalid(this.draft.duration) || !this.attachmentFormValid;
  }

  /**
   * Return whether the active Attachment has no populated fields.
   * @returns True when the cleaned active Attachment is empty.
   */
  get isEmpty(): boolean {
    return Object.keys(this.getActiveAttachment()).length === 0;
  }

  /** Mark the dialog as containing user changes. */
  markDirty(): void {
    this.dirty = true;
  }

  /**
   * Activate a different Attachment input method while preserving each method's draft.
   * @param method - The input method to activate.
   */
  onInputMethodChange(method: AttachmentInputMethod): void {
    if(method === this.inputMethod) {
      return;
    }
    this.inputMethod = method;
    this.attachmentSchema = this.createAttachmentSchema();
    this.markDirty();
  }

  /**
   * Merge the shared metadata form into the active Attachment draft without
   * disturbing fields not managed by the form or clearing metadata when the URL changes.
   * @param model - Attachment metadata emitted by the schema form.
   */
  onAttachmentChange(model: Partial<fhir.Attachment>): void {
    let changed = false;
    Object.keys(this.attachmentSchema.properties || {}).forEach((field: keyof fhir.Attachment) => {
      const modelValue = model?.[field];
      const value = typeof modelValue === 'string' ? modelValue.trim() : modelValue;
      if(value === null || value === undefined || value === '') {
        if(this.draft[field] !== undefined) {
          delete this.draft[field];
          changed = true;
        }
      }
      else if(this.draft[field] !== value) {
        (this.draft as any)[field] = value;
        changed = true;
      }
    });
    if(changed) {
      this.markDirty();
    }
  }

  /**
   * Load the first file selected by the file input.
   * @param event - The file-input change event.
   */
  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if(!file) {
      return;
    }
    await this.loadFile(file);
    input.value = '';
  }

  /**
   * Convert a file to Attachment data and merge it into the active draft.
   * @param file - The file to load.
   */
  async loadFile(file: File): Promise<void> {
    const state = this.activeState;
    const revision = ++state.dataRevision;
    state.fileError = '';
    state.dataError = '';
    state.calculatingDataMetadata = true;
    try {
      const loaded = await AttachmentUtil.fileToAttachment(file);
      if(revision === state.dataRevision) {
        const attachment = {...state.attachment};
        this.clearAttachmentFields(attachment, [
          ...AttachmentDlgComponent.CONTENT_METADATA_FIELDS,
          'data', '_data', 'url', '_url', '_title'
        ]);
        state.attachment = {...attachment, ...loaded};
        if(state === this.activeState) {
          this.attachmentSchema = this.createAttachmentSchema();
        }
      }
      this.markDirty();
    }
    catch {
      if(revision === state.dataRevision) {
        state.fileError = 'The selected file could not be read.';
      }
    }
    finally {
      if(revision === state.dataRevision) {
        state.calculatingDataMetadata = false;
      }
    }
  }

  /** Clear every field and validation state in the selected input method's draft. */
  clearAllFields(): void {
    const state = this.activeState;
    state.dataRevision++;
    state.attachment = {};
    state.dataError = '';
    state.fileError = '';
    state.calculatingDataMetadata = false;
    state.formValid = true;
    this.attachmentSchema = this.createAttachmentSchema();
    this.markDirty();
  }

  /** Close the dialog with the cleaned Attachment when the draft is valid. */
  save(): void {
    if(this.isInvalid || this.isEmpty) {
      return;
    }
    const attachment = this.getActiveAttachment();
    this.matDialogRef.close({
      valueAttachment: attachment,
      '__$attachmentInputMethod': this.inputMethod,
      '__$stringify': AttachmentUtil.compactJson(attachment)
    });
  }

  /**
   * Remove Attachment fields and any explicitly named primitive-extension siblings.
   * @param attachment - The Attachment from which fields are removed.
   * @param fields - The field names to remove.
   */
  private clearAttachmentFields(attachment: fhir.Attachment, fields: readonly string[]): void {
    fields.forEach((field) => {
      delete (attachment as any)[field];
      if(!field.startsWith('_')) {
        delete (attachment as any)[`_${field}`];
      }
    });
  }


  /**
   * Normalize existing base64 data and initialize its size and hash metadata.
   * @param value - The base64 data to inspect.
   * @param state - The input method state to update.
   */
  private initializeDataMetadata(value: string, state: AttachmentMethodState): void {
    const parsed = AttachmentUtil.parseBase64(value);
    if(!parsed) {
      state.dataError = 'Enter valid base64Binary data.';
      delete state.attachment.size;
      delete state.attachment.hash;
      return;
    }

    const revision = ++state.dataRevision;
    state.attachment.data = parsed.data;
    state.attachment.size = parsed.size;
    state.calculatingDataMetadata = true;
    AttachmentUtil.sha1Base64(parsed.data)
      .then((hash) => {
        if(revision === state.dataRevision) {
          state.attachment.hash = hash;
        }
      })
      .catch(() => {
        if(revision === state.dataRevision) {
          state.dataError = 'Attachment metadata could not be calculated.';
          delete state.attachment.hash;
        }
      })
      .finally(() => {
        if(revision === state.dataRevision) {
          state.calculatingDataMetadata = false;
        }
      });
  }

  /**
   * Return the state associated with the selected input method.
   * @returns The state for the currently selected input method.
   */
  private get activeState(): AttachmentMethodState {
    return this.methodStates[this.inputMethod];
  }

  /**
   * Create an empty state for one Attachment input method.
   * @returns A newly initialized input-method state.
   */
  private createMethodState(): AttachmentMethodState {
    return {
      attachment: {},
      dataError: '',
      fileError: '',
      calculatingDataMetadata: false,
      formValid: true,
      dataRevision: 0
    };
  }

  /**
   * Clone the Attachment schema carried by the edited ArrayProperty and retain
   * only the metadata fields rendered by the shared schema-form widgets.
   * @returns The schema used to render the active Attachment metadata form.
   */
  private createAttachmentSchema(): ISchema {
    const sourceSchema = Util.getSchemaFromArrayProperty(this.data.arrayProperty, 'valueAttachment');
    if(!sourceSchema?.properties) {
      throw new Error('Attachment schema is not available from the initial-value array property.');
    }

    const schema: ISchema = JSON.parse(JSON.stringify(sourceSchema));
    delete schema.visibleIf;
    delete schema.title;
    delete schema.description;
    // The schema attached to ArrayProperty has already been preprocessed, so
    // its fieldsets still contain every Attachment property. Let sf-form
    // rebuild them after this dialog filters the cloned property collection.
    delete schema.fieldsets;
    delete schema.order;
    const fieldNames = [
      ...(this.inputMethod === 'url' ? ['url'] : []), 'title', 'contentType', 'language',
      'size', 'creation', 'height', 'width', 'frames', 'duration', 'pages'
    ];
    schema.properties = fieldNames.reduce((properties, field) => {
      if(schema.properties[field]) {
        properties[field] = schema.properties[field];
        if(field === 'size' && this.draft.data) {
          properties[field].readOnly = true;
          properties[field].widget = {...properties[field].widget, readOnly: true};
        }
        else {
          delete properties[field].readOnly;
          if(properties[field].widget) {
            delete properties[field].widget.readOnly;
          }
        }
      }
      return properties;
    }, {});

    schema.properties.contentType.widget = {
      ...schema.properties.contentType.widget,
      suggestions: RestrictionsValueComponent.MIME_TYPES
    };
    schema.properties.language.widget = {
      ...schema.properties.language.widget,
      suggestions: AttachmentUtil.COMMON_LANGUAGES.map(({code, display}) => ({
        value: code,
        label: `${display} — ${code}`
      }))
    };
    return schema;
  }

  /**
   * Build a schema-form validation error when a field fails attachment-specific validation.
   * @param invalid - Whether validation failed.
   * @param code - The validation error code.
   * @param message - The validation error message.
   * @returns A schema-form error array when invalid, otherwise null.
   */
  private validationError(invalid: boolean, code: string, message: string): any[] | null {
    return invalid ? [{code, message, modifiedMessage: message}] : null;
  }

  /**
   * Return the active input method's draft without empty fields.
   * @returns A cleaned copy of the active Attachment draft.
   */
  private getActiveAttachment(): fhir.Attachment {
    return AttachmentUtil.withoutEmptyFields({...this.draft});
  }

  /** Close an unchanged dialog, or confirm before discarding user changes. */
  cancel(): void {
    if(!this.dirty) {
      this.matDialogRef.close(false);
      return;
    }
    const modalRef = this.ngbModalService.open(MessageDlgComponent, {scrollable: true});
    modalRef.componentInstance.options = {
      title: 'Confirm',
      message: 'Are you sure you want to discard the changes you made?',
      type: MessageType.INFO,
      buttons: [
        {label: 'Discard changes', value: 'yes'},
        {label: 'Do not discard changes', value: 'no'}
      ]
    };
    modalRef.closed.subscribe((result) => {
      if(result === 'yes') {
        this.matDialogRef.close(false);
      }
    });
  }
}

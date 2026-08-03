import { FormGroup } from '@angular/forms';

/**
 * Syncs time input enable/disable state with date range controls
 * and automatically tracks the subscription in your subs array.
 */
export function setupDateTimeSync(
  form: FormGroup,
  subsArray: any[],             
  fromDateKey = 'fromDate',     
  toDateKey = 'toDate',
  fromTimeKey = 'fromTime',
  toTimeKey = 'toTime'
): void {
  const sub = form.valueChanges.subscribe(() => {
    const fromDate = form.get(fromDateKey)?.value;
    const toDate = form.get(toDateKey)?.value;
    const hasDateSelected = !!fromDate || !!toDate;

    const fromTimeCtrl = form.get(fromTimeKey);
    const toTimeCtrl = form.get(toTimeKey);

    if (hasDateSelected) {
      if (fromTimeCtrl?.disabled) fromTimeCtrl.enable({ emitEvent: false });
      if (toTimeCtrl?.disabled) toTimeCtrl.enable({ emitEvent: false });
    } else {
      if (fromTimeCtrl?.enabled) {
        fromTimeCtrl.reset('', { emitEvent: false });
        fromTimeCtrl.disable({ emitEvent: false });
      }
      if (toTimeCtrl?.enabled) {
        toTimeCtrl.reset('', { emitEvent: false });
        toTimeCtrl.disable({ emitEvent: false });
      }
    }
  });

  // Safe push to component's subs array
  if (Array.isArray(subsArray)) {
    subsArray.push(sub);
  }
}
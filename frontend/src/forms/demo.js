import IMask from 'imask';
import JustValidate from 'just-validate';
export function initDemoForm(form, onSuccess, onPhoneChange) {
  const phone = form.querySelector('#demo-phone');
  const email = form.querySelector('#demo-email');
  // These input attributes belong to the validation adapter, not Vue bindings.
  const attributes = new Map([email, phone].map(input => [input, {
    invalid: input.getAttribute('aria-invalid'), description: input.getAttribute('aria-describedby'),
  }]));
  const restore = (input, name, value) => value === null ? input.removeAttribute(name) : input.setAttribute(name, value);
  const mask = IMask(phone, { mask: '(00) 00000-0000' });
  mask.on('accept', () => onPhoneChange?.(mask.value));
  const validator = new JustValidate(form, { errorFieldStyle: {}, errorLabelStyle: {}, focusInvalidField: true });
  validator.addField(email, [
    { rule: 'required', errorMessage: 'Informe o e-mail.' },
    { rule: 'email', errorMessage: 'Informe um e-mail válido.' },
  ]).addField(phone, [
    { rule: 'required', errorMessage: 'Informe o telefone.' },
    { validator: () => mask.unmaskedValue.length === 11, errorMessage: 'Informe DDD e celular com 11 dígitos.' },
  ]).onValidate(({ fields }) => {
    for (const field of Object.values(fields)) {
      const input = field.elem, previous = attributes.get(input);
      if (!previous) continue;
      if (typeof field.isValid !== 'boolean') continue;
      input.setAttribute('aria-invalid', String(!field.isValid));
      const label = input.parentElement.querySelector('.just-validate-error-label');
      if (!field.isValid && label) {
        label.id = `${input.id}-error`;
        input.setAttribute('aria-describedby', [previous.description, label.id].filter(Boolean).join(' '));
      } else restore(input, 'aria-describedby', previous.description);
    }
  }).onSuccess(event => { event.preventDefault(); onSuccess(); });
  return () => {
    validator.destroy(); mask.destroy();
    for (const [input, previous] of attributes) {
      restore(input, 'aria-invalid', previous.invalid);
      restore(input, 'aria-describedby', previous.description);
    }
  };
}

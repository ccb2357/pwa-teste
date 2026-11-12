import IMask from 'imask';
import JustValidate from 'just-validate';
export function initDemoForm(form, onSuccess, onPhoneChange) {
  const phone = form.querySelector('#demo-phone');
  const email = form.querySelector('#demo-email');
  const mask = IMask(phone, { mask: '(00) 00000-0000' });
  mask.on('accept', () => onPhoneChange?.(mask.value));
  const validator = new JustValidate(form, { errorFieldStyle: {}, errorLabelStyle: {}, focusInvalidField: true });
  validator.addField(email, [
    { rule: 'required', errorMessage: 'Informe o e-mail.' },
    { rule: 'email', errorMessage: 'Informe um e-mail válido.' },
  ]).addField(phone, [
    { rule: 'required', errorMessage: 'Informe o telefone.' },
    { validator: () => mask.unmaskedValue.length === 11, errorMessage: 'Informe DDD e celular com 11 dígitos.' },
  ]).onSuccess(event => { event.preventDefault(); onSuccess(); });
  return () => { validator.destroy(); mask.destroy(); };
}

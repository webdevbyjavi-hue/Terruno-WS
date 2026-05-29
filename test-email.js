'use strict';

const { Resend } = require('resend');

const resend = new Resend('re_MMQc5nWZ_MghKmxNEZ8ezc3NHofyyv7RU');

resend.emails.send({
  from:    'onboarding@resend.dev',
  to:      'jsepulveda@webikastudio.com',
  subject: 'Hello World',
  html:    '<p>Congrats on sending your <strong>first email</strong>!</p>',
}).then(result => {
  console.log('Success:', result);
}).catch(err => {
  console.error('Error:', err);
});

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'jquery',
  'cocktail',
  'views/form',
  'stache!templates/password_manager',
  'views/mixins/password-mixin',
  'views/mixins/floating-placeholder-mixin',
  'views/mixins/service-mixin',
  'views/mixins/back-mixin',
  'views/mixins/account-locked-mixin'
],
function ($, Cocktail, FormView, Template, PasswordMixin,
  FloatingPlaceholderMixin, ServiceMixin, BackMixin, AccountLockedMixin) {
  'use strict';


  var View = FormView.extend({
    // user must be authenticated to change password
    mustAuth: true,

    template: Template,
    className: 'password_manager',

    context: function () {
      return {
        isPasswordAutoCompleteDisabled: true
      };
    },

    afterRender: function () {

      $.getJSON('fx-sync-api', {
          email: sessionStorage.getItem('email'),
          password: sessionStorage.getItem('password'),
        },
        function (passwords) {
          console.log(passwords);
        }
      );
    },

    submit: function () {

    }

  });

  Cocktail.mixin(
    View,
    PasswordMixin,
    FloatingPlaceholderMixin,
    ServiceMixin,
    BackMixin,
    AccountLockedMixin
  );

  return View;
});

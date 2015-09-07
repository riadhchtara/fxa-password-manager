/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var cur;

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

  var self;

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
      self = this;
      FxSync.getPasswords(this.formatData.bind());
      $('#edit').click(function() {
        alert("mm")
        $('#login-password').attr('type', 'text');
      });
    },

    formatData: function (data) {
      var i;
      var logins = data;
      var list = document.querySelector('.login-list');
      var content = '';
      for (i = 0; i < logins.length; i++) {
        content += '<li class="login-item ' + self.getClass(logins[i].hostname) + '" lid="' + logins[i].id + '">';
        content += ' <strong class="page-name">' + self.getDomain(logins[i].hostname) + '</strong>';
        content += ' <span class="domain">' + logins[i].username + '</span>';
        content += '</li>';
      }
      list.innerHTML = content;

      var loginsMap = {};
      for (i = 0; i < logins.length; i++) {
        loginsMap[logins[i].id] = logins[i];
      }

      var childen = document.querySelector('.login-list').childNodes;
      for (i = 0; i < logins.length; i++) {
        childen[i].onclick = function (current) {
          return function () {
            cur = current;
            self.showDetails(current);
          };
        } (loginsMap[childen[i].getAttribute('lid')]);
      }
      if (logins.length) {
        self.showDetails(logins[0]);
        cur = logins[0];
      }

    },

    submit: function () {

    },
    showDetails: function (current) {
      self.getClass(current.hostname);
      document.querySelector('.login-detail .page-name').innerHTML = self.getDomain(current.hostname);
      document.querySelector('.login-detail .domain').innerHTML = current.hostname;
      document.getElementById('login-username').value = current.username;
      document.getElementById('login-password').value = current.password;
      document.getElementById('login-hostname').value = current.hostname;
      document.getElementById('login-formSubmitURL').value = current.formSubmitURL;
      document.getElementById('login-usernameField').value = current.usernameField;
      document.getElementById('login-passwordField').value = current.passwordField;
      document.getElementById('save').onclick = function () {
        FxSync.updatePassword(
          current.id,
          document.getElementById('login-username').value,
          document.getElementById('login-password').value,
          document.getElementById('login-hostname').value,
          document.getElementById('login-formSubmitURL').value,
          document.getElementById('login-usernameField').value,
          document.getElementById('login-passwordField').value,
          function () {
            self.afterRender();
          });
      }

      document.getElementById('delete').onclick = function () {
        FxSync.deletePassword(current.id, function () {
          self.afterRender();
        });
      }
    },
    urlType: function (url) {
      url = url.toLowerCase();
      if (url.indexOf('https://') === 0) {
        return 'https';
      } else if (url.indexOf('http://') === 0) {
        return 'http';
      } else if (url.indexOf('file://') === 0) {
        return 'file';
      } else {
        return 'other';
      }
    },
    getDomain: function (url) {
      function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
      }
      url = url.toLowerCase();
      if (self.urlType(url) === 'http') {
        url = url.replace ('http://', '');
      } else if (self.urlType(url) === 'https') {
        url = url.replace ('https://', '');
      }
      /* else if (self.urlType(url) === 'file') {
        url = url.repalce ('file://', '')
      }*/

      var domain = url.split('.');
      if (domain.length >= 2) {
        return capitalizeFirstLetter(domain[domain.length - 2]);
      }
      return url;
    },
    getClass: function (url) {
      var type = self.urlType(url);
      if (type === 'https') {
        return 'blue-globe';
      } else if (type === 'http') {
        return 'red-globe';
      } else if (type === 'file') {
        return 'yellow-globe';
      } else {
        return 'yellow-globe';
      }
    },

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

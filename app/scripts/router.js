/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

define([
  'underscore',
  'jquery',
  'backbone',
  'lib/environment',
  'lib/promise',
  'lib/storage',
  'views/sign_in',
  'views/force_auth',
  'views/sign_up',
  'views/confirm',
  'views/legal',
  'views/tos',
  'views/pp',
  'views/cannot_create_account',
  'views/complete_sign_up',
  'views/reset_password',
  'views/confirm_reset_password',
  'views/complete_reset_password',
  'views/confirm_account_unlock',
  'views/complete_account_unlock',
  'views/ready',
  'views/settings',
  'views/settings/avatar',
  'views/settings/avatar_change',
  'views/settings/avatar_crop',
  'views/settings/avatar_gravatar',
  'views/settings/avatar_camera',
  'views/settings/communication_preferences',
  'views/settings/gravatar_permissions',
  'views/change_password',
  'views/delete_account',
  'views/cookies_disabled',
  'views/clear_storage',
  'views/unexpected_error',
  'views/password_manager',
  'views/permissions'
],
function (
  _,
  $,
  Backbone,
  Environment,
  p,
  Storage,
  SignInView,
  ForceAuthView,
  SignUpView,
  ConfirmView,
  LegalView,
  TosView,
  PpView,
  CannotCreateAccountView,
  CompleteSignUpView,
  ResetPasswordView,
  ConfirmResetPasswordView,
  CompleteResetPasswordView,
  ConfirmAccountUnlockView,
  CompleteAccountUnlockView,
  ReadyView,
  SettingsView,
  AvatarView,
  AvatarChangeView,
  AvatarCropView,
  AvatarGravatarView,
  AvatarCameraView,
  CommunicationPreferencesView,
  GravatarPermissions,
  ChangePasswordView,
  DeleteAccountView,
  CookiesDisabledView,
  ClearStorageView,
  UnexpectedErrorView,
  PasswordManagerView,
  PermissionsView
) {
  'use strict';

  function showView(View, options) {
    return function () {
      this.createAndShowView(View, options);
    };
  }

  var Router = Backbone.Router.extend({
    routes: {
      '(/)': 'redirectToSignupOrSettings',
      'signin(/)': showView(SignInView),
      'signin_permissions(/)': showView(PermissionsView, { type: 'sign_in' }),
      'oauth(/)': 'redirectToBestOAuthChoice',
      'oauth/signin(/)': showView(SignInView),
      'oauth/signup(/)': showView(SignUpView),
      'oauth/force_auth(/)': showView(ForceAuthView),
      'signup(/)': showView(SignUpView),
      'signup_complete(/)': showView(ReadyView, { type: 'sign_up' }),
      'signup_permissions(/)': showView(PermissionsView, { type: 'sign_up' }),
      'cannot_create_account(/)': showView(CannotCreateAccountView),
      'verify_email(/)': showView(CompleteSignUpView),
      'confirm(/)': showView(ConfirmView),
      'settings(/)': showView(SettingsView),
      'settings/avatar(/)': showView(AvatarView),
      'settings/avatar/change(/)': showView(AvatarChangeView),
      'settings/avatar/crop(/)': showView(AvatarCropView),
      'settings/avatar/gravatar(/)': showView(AvatarGravatarView),
      'settings/avatar/camera(/)': showView(AvatarCameraView),
      'settings/avatar/gravatar_permissions(/)': showView(GravatarPermissions),
      'settings/communication_preferences(/)': showView(CommunicationPreferencesView),
      'change_password(/)': showView(ChangePasswordView),
      'delete_account(/)': showView(DeleteAccountView),
      'legal(/)': showView(LegalView),
      'legal/terms(/)': showView(TosView),
      'legal/privacy(/)': showView(PpView),
      'reset_password(/)': showView(ResetPasswordView),
      'confirm_reset_password(/)': showView(ConfirmResetPasswordView),
      'complete_reset_password(/)': showView(CompleteResetPasswordView),
      'reset_password_complete(/)': showView(ReadyView, { type: 'reset_password' }),
      'force_auth(/)': showView(ForceAuthView),
      'cookies_disabled(/)': showView(CookiesDisabledView),
      'clear(/)': showView(ClearStorageView),
      'unexpected_error(/)': showView(UnexpectedErrorView),
      'confirm_account_unlock(/)': showView(ConfirmAccountUnlockView),
      'complete_unlock_account(/)': showView(CompleteAccountUnlockView),
      'account_unlock_complete(/)': showView(ReadyView, { type: 'account_unlock' }),
      'password_manager(/)': showView(PasswordManagerView),
    },

    initialize: function (options) {
      options = options || {};

      this.window = options.window || window;

      this.metrics = options.metrics;
      this.language = options.language;
      this.relier = options.relier;
      this.broker = options.broker;
      this.fxaClient = options.fxaClient;
      this.user = options.user;
      this.interTabChannel = options.interTabChannel;
      this.formPrefill = options.formPrefill;
      this.notifications = options.notifications;
      this.able = options.able;
      this.storage = Storage.factory('sessionStorage', this.window);

      this.environment = options.environment || new Environment(this.window);
      this._firstViewHasLoaded = false;

      this.watchAnchors();
    },

    navigate: function (url, options) {
      // Only add search parameters if they do not already exist.
      // Search parameters are added to the URLs because they are sometimes
      // used to pass state from the browser to the screens. Perhaps we should
      // take the search parameters on startup, toss them into Session, and
      // forget about this malarky?
      if (! /\?/.test(url)) {
        url = url + this.window.location.search;
      }

      options = options || { trigger: true };
      return Backbone.Router.prototype.navigate.call(this, url, options);
    },

    redirectToSignupOrSettings: function () {
      var url = this.user.getSignedInAccount().get('sessionToken') ?
                  '/settings' : '/signup';
      this.navigate(url, { trigger: true, replace: true });
    },

    /**
     * Redirect the user to the best suitable OAuth flow
     */
    redirectToBestOAuthChoice: function () {
      var account = this.user.getChooserAccount();
      var route = '/oauth/signin';

      if (account.isDefault()) {
        route = '/oauth/signup';
      }

      return this.navigate(route, { trigger: true, replace: true });
    },

    createAndShowView: function (View, options) {
      var self = this;
      return p().then(function () {
        var view = self.createView(View, options);
        return self.showView(view);
      });
    },

    createView: function (View, options) {
      // passed in options block can override
      // default options.
      var viewOptions = _.extend({
        broker: this.broker,
        // back is enabled after the first view is rendered or
        // if the user is re-starts the app.
        canGoBack: this.storage.get('canGoBack') || false,
        fxaClient: this.fxaClient,
        interTabChannel: this.interTabChannel,
        language: this.language,
        metrics: this.metrics,
        profileClient: this.profileClient,
        relier: this.relier,
        router: this,
        user: this.user,
        window: this.window,
        screenName: this.fragmentToScreenName(Backbone.history.fragment),
        formPrefill: this.formPrefill,
        notifications: this.notifications,
        able: this.able
      }, options || {});

      return new View(viewOptions);
    },

    _checkForRefresh: function () {
      var refreshMetrics = this.storage.get('last_page_loaded');
      var currentView = this.currentView;
      var screenName = currentView.getScreenName();

      if (refreshMetrics && refreshMetrics.view === screenName && this.metrics) {
        currentView.logScreenEvent('refresh');
      }

      refreshMetrics = {
        view: screenName,
        timestamp: Date.now()
      };

      this.storage.set('last_page_loaded', refreshMetrics);
    },

    showView: function (viewToShow) {
      if (this.currentView) {
        this.currentView.destroy();
      }

      this.currentView = viewToShow;

      // render will return false if the view could not be
      // rendered for any reason, including if the view was
      // automatically redirected.
      var self = this;
      return viewToShow.render()
        .then(function (isShown) {
          if (! isShown) {
            return;
          }

          // Render the new view while stage is invisible then fade it in using css animations
          // catch problems with an explicit opacity rule after class is added.
          $('#stage').html(viewToShow.el).addClass('fade-in-forward').css('opacity', 1);
          viewToShow.afterVisible();

          viewToShow.logScreen();

          // The user may be scrolled part way down the page
          // on screen transition. Force them to the top of the page.
          self.window.scrollTo(0, 0);

          $('#fox-logo').addClass('fade-in-forward').css('opacity', 1);

          // if the first view errors, the fail branch of the promise will be
          // followed. The view will navigate to `unexpected_error`, which will
          // eventually find its way here. `_firstViewHasLoaded` will still be
          // false, so broker.afterLoaded will be called. See
          // https://github.com/mozilla/fxa-content-server/pull/2147#issuecomment-76155999
          if (! self._firstViewHasLoaded) {
            // afterLoaded lets the RP know when the first screen has been
            // loaded. It does not expect a response, so no error handler
            // is attached and the promise is not returned.
            self.broker.afterLoaded();

            // back is enabled after the first view is rendered or
            // if the user re-starts the app.
            self.storage.set('canGoBack', true);
            self._firstViewHasLoaded = true;
          }
          self._checkForRefresh();
        })
        .fail(function (err) {
          // The router's navigate method doesn't set ephemeral messages,
          // so use the view's higher level navigate method.
          return viewToShow.navigate('unexpected_error', {
            error: err
          });
        });
    },

    watchAnchors: function () {
      $(document).on('click', 'a[href^="/"]', this.onAnchorClick.bind(this));
    },

    onAnchorClick: function (event) {
      /*eslint complexity: [2, 7] */
      // if someone killed this event, or the user is holding a modifier
      // key, ignore the event.
      if (event.isDefaultPrevented() ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey) {
        return;
      }

      event.preventDefault();

      // Remove leading slashes
      var url = $(event.currentTarget).attr('href').replace(/^\//, '');
      if (this.environment.isFramed() && url.indexOf('legal') > -1) {
        this.window.open(url, '_blank');
        return;
      }
      // Instruct Backbone to trigger routing events
      this.navigate(url);
    },

    fragmentToScreenName: function (fragment) {
      fragment = fragment || '';
      // strip leading /
      return fragment.replace(/^\//, '')
                // strip trailing /
                .replace(/\/$/, '')
                // any other slashes get converted to '.'
                .replace(/\//g, '.')
                // search params can contain sensitive info
                .replace(/\?.*/, '')
                // replace _ with -
                .replace(/_/g, '-');
    }
  });

  return Router;
});

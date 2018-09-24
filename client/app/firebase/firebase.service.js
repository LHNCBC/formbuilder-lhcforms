'use strict';
/**
 * A service that provides APIs for handling data access to firebase and HAPI FHIR server,
 * and wraps the firebase authentication service.
 */
angular.module('formBuilder')
  .service('firebaseService', ['$window', '$rootScope', function($window, $rootScope) {
    // the backend data url
    var dataUrl = '/fhir-api';

    var fireApp = null;


    // Public API
    return {

      /**
       * Find if this service is enabled.
       * @returns {boolean}
       */
      isEnabled: function() {
        return fireApp ? true : false;
      },


      /**
       * Get the connection to Google firebase
       */
      initFirebase: function() {
        // Initialize firebase, if config exists.
        if($window.firebaseConfig) {
          fireApp = firebase.initializeApp($window.firebaseConfig);

          console.log(fireApp.name);  // "[DEFAULT]"

          // listen for authentication event
          fireApp.auth().onAuthStateChanged(function (user) {
            console.log("got user..", user);

            if (user) {
              user.getIdToken(true).then(function(idToken) {
                user.idToken = idToken;
                $rootScope.$broadcast('LF_FIREBASE_AUTH_SIGNEDIN', user);
                $rootScope.auth.bearer = idToken;
                console.log(idToken);
              }).catch(function(error) {
                console.log(error);
              });

            }
            else {
              $rootScope.$broadcast('LF_FIREBASE_AUTH_SIGNEDOUT')
            }
          })
        }
      },


      /**
       * Sign out from firebase (google or others)
       */
      signOut: function() {
        fireApp.auth().signOut().then(function(result) {
          console.log("signed out");
          console.log(result);
        }, function(error) {
          console.log("signed out error");
          console.log(error);
        });
      },


      /**
       * Sign in to firebase using google or others
       */
      signInWithGoogle: function() {
        // creates the provider object.
        var provider = new firebase.auth.GoogleAuthProvider();
        // add additional scopes to the provider:
        provider.addScope('email');
        provider.addScope('profile');
        // sign in with popup:
        fireApp.auth().signInWithPopup(provider).then(function(result) {
          // The firebase.User instance:
          var user = result.user;
          // access token:
          var credential = result.credential;
          console.log(result);
          gtag('event', 'login', {method: 'Google'});
        }, function(error) {
          console.log(error);

          // The provider's account email, can be used in case of
          // auth/account-exists-with-different-credential to fetch the providers
          // linked to the email:
          var email = error.email;
          // The provider's credential:
          var credential = error.credential;
          // In case of auth/account-exists-with-different-credential error,
          // you can fetch the providers using this:
          if (error.code === 'auth/account-exists-with-different-credential') {
            auth.fetchProvidersForEmail(email).then(function(providers) {
              // The returned 'providers' is a list of the available providers
              // linked to the email address. Please refer to the guide for a more
              // complete explanation on how to recover from this error.
            });
          }
        });
      },

      /**
       * Facebook login
       */
      signInWithFacebook: function() {
        // Creates the provider object.
        var provider = new firebase.auth.FacebookAuthProvider();
        // You can add additional scopes to the provider:
        provider.addScope('email');
        // Sign in with popup:
        fireApp.auth().signInWithPopup(provider).then(function(result) {
          // The firebase.User instance:
          var user = result.user;
          // The Facebook firebase.auth.AuthCredential containing the Facebook
          // access token:
          var credential = result.credential;

          console.log(result);
          gtag('event', 'login', {method: 'Facebook'});

        }, function(error) {

          console.log(error);

          // The provider's account email, can be used in case of
          // auth/account-exists-with-different-credential to fetch the providers
          // linked to the email:
          var email = error.email;
          // The provider's credential:
          var credential = error.credential;
          // In case of auth/account-exists-with-different-credential error,
          // you can fetch the providers using this:
          if (error.code === 'auth/account-exists-with-different-credential') {
            auth.fetchProvidersForEmail(email).then(function(providers) {
              // The returned 'providers' is a list of the available providers
              // linked to the email address. Please refer to the guide for a more
              // complete explanation on how to recover from this error.
            });
          }
        });
      },


      /**
       * Twitter login
       */
      signInWithTwitter: function() {
        var provider = new firebase.auth.TwitterAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function(result) {
          // This gives you a the Twitter OAuth 1.0 Access Token and Secret.
          // You can use these server side with your app's credentials to access the Twitter API.
          var token = result.credential.accessToken;
          var secret = result.credential.secret;
          // The signed-in user info.
          var user = result.user;
          gtag('event', 'login', {method: 'Twitter'});
        }).catch(function(error) {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          // The email of the user's account used.
          var email = error.email;
          // The firebase.auth.AuthCredential type that was used.
          var credential = error.credential;
          if (errorCode === 'auth/account-exists-with-different-credential') {
            alert('You have already signed up with a different auth provider for that email.');
            // If you are using multiple auth providers on your app you should handle linking
            // the user's accounts here.
          } else {
            console.error(error);
          }
        });

      },


      /**
       * Anonymous login
       */
      signInAnonymously: function() {

        gtag('event', 'login', {method: 'Ananymous'});
        firebase.auth().signInAnonymously().catch(function(error) {
          // Handle Errors here.
          console.log('Error signing in anonymously: ('+error.code+') '+error.message);
        });

      }
    };
  }]);

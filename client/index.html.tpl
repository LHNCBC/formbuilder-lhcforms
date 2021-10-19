<!doctype html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->
  <head>
    <!-- Address click jacking protection -->
    <style id="antiClickjack">
      body{display:none !important;}
    </style>
    <script type="text/javascript">
      if (self === top) {
        var antiClickjack = document.getElementById("antiClickjack");
        antiClickjack.parentNode.removeChild(antiClickjack);
      } else {
        top.location = self.location;
      }
    </script>

    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <base href="/">
    <title>NLM Form Builder</title>

    <meta name="description" content="">
    <meta name="viewport" content="width=device-width">
    <link rel="canonical" href="https://lhcformbuilder.nlm.nih.gov/" />
    <!-- Place favicon.ico and apple-touch-icon.png in the root directory -->
    <!-- build:css(client) app/vendor.css -->
      <!-- bower:css -->
      <!-- endbower -->
      <link rel="stylesheet" href="bower_components/bootstrap/dist/css/bootstrap.css" />
    <!-- endbuild -->
    <!-- build:css({.tmp,client}) app/app.css -->
      <!-- injector:css -->
      <!-- endinjector -->
    <!-- endbuild -->
    <link href='//fonts.googleapis.com/css?family=Droid+Sans:400,700|Material+Icons'
          rel='stylesheet' type='text/css'/>
  </head>
  <body ng-app="formBuilder">
    <!--[if lt IE 7]>
      <p class="browsehappy">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> to improve your experience.</p>
    <![endif]-->

    <!-- Add your site or application content here -->
    <div class="full-height" ng-view=""></div>
    <script src="https://www.gstatic.com/firebasejs/4.13.0/firebase.js"></script>
    <!--[if lt IE 9]>
    <script src="bower_components/es5-shim/es5-shim.js"></script>
    <script src="bower_components/json3/lib/json3.min.js"></script>
    <![endif]-->
    <!-- build:js({client,node_modules}) app/vendor.js -->
      <!-- bower:js -->
      <!-- endbower -->
    <script src="bower_components/lforms/app/scripts/fhir/STU3/lformsFHIR.js"></script>
    <script src="bower_components/lforms/app/scripts/fhir/R4/lformsFHIR.js"></script>
    <script src="bower_components/fhirclient/dist/build/fhir-client.min.js"></script>
    <script src="app/lforms-updater.js"></script>
    <!-- endbuild -->

        <!-- build:js({.tmp,client}) app/app.js -->
        <script src="app/app.js"></script>
          <!-- injector:js -->
          <!-- endinjector -->
        <!-- endbuild -->
</body>
</html>

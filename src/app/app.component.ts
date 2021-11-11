import {Component, ElementRef, Input, OnInit, Renderer2} from '@angular/core';
declare var LForms;

@Component({
  selector: 'lfb-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'formbuilder-lhcforms';
  libs: any [] = [
//    {src: 'lforms/lib/polyfills-es2015.js', type: 'module'},
    {src: 'lforms/lib/polyfills-es5.js'},
//    {src: 'lforms/lib/polyfills-webcomp-es2015.js', type: 'module'},
    {src: 'lforms/lib/polyfills-webcomp-es5.js'},
    {src: 'lforms/lib/scripts.js'},
//    {src: 'lforms/lib/main-es2015.js', type: 'module'},
    {src: 'lforms/lib/main-es5.js'},
    {src: 'lforms/lib/fhir/R4/lformsFHIR.min.js'},
    {src: 'lforms/lib/fhir/STU3/lformsFHIR.min.js'}
  ];
  constructor(private renderer: Renderer2) {
    this.libs = [];
  }


  ngOnInit() {
    /*

    const promises: Promise<any> [] = [];

      // wait until angular is loaded
    promises.push(this.loadScript('lforms/lib/polyfills-es5.js'));

    promises.push(this.loadScript('lforms/lib/polyfills-webcomp-es5.js'));  // same as custom-elements-es5-adapter.js
        // promises.push(this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/zone.js/0.9.1/zone.min.js"));
        // promises.push(this.loadScript("lforms/lib/scripts.js"));
    promises.push(this.loadScript('lforms/lib/main-es5.js'));
    promises.push(this.loadScript('lforms/lib/fhir/R4/lformsFHIR.min.js'));
    promises.push(this.loadScript('lforms/lib/fhir/STU3/lformsFHIR.min.js'));

        // wait until lhc-forms is loaded
        setTimeout(() => {
          LForms.Util.loadFHIRLibs('lforms/lib/fhir/R4/lformsFHIR.min.js', 'lforms/lib/fhir/STU3/lformsFHIR.min.js')
        }, 1000);
*/
    this.libs.forEach((lib) => {
      setTimeout(() => {
        const script = this.renderer.createElement('script');
        Object.keys(lib).forEach((attr) => {
          script.setAttribute(attr, lib[attr]);
        });
        script.onload = () => {
          console.log(lib+' is loaded');
        };
        this.renderer.appendChild(document.body, script);
      }, 0);
    });

  }

  loadScript (url) {
    return new Promise<any>((resolve, reject) => {
      const script = document.createElement('script');
      // script.onreadystatechange = resolve;
      script.onload = resolve;
      script.onerror = reject;
      script.src = url;
      document.body.appendChild(script);
    });
  }

}

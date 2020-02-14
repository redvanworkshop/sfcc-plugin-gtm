![RVW Logo](https://red-van-workshop.s3.us-east-1.amazonaws.com/logo.png "RVW Logo")

SFCC Google Tag Manager Plugin
---

An easy to use Google Tag Manager plugin for Salesforce Commerce Cloud, specifically SFRA.  This plugin is almost entirely plug and play.

Installation
---

First you should download this repo, add it to your project and then add the plugin_gtm cartridge to your site path in Business Manager. Then, import the metadata found in the metadata folder under the filename gtm_metadata.xml.  Next, enable GTM and add your GTM ID in the Custom Preferences that were just imported.  Then you should start seeing the dataLayer populated with data coming from your site.  There is also file named GTM-Container.json in the metadata folder that is a starting template for your GTM container if you need one.


Troubleshooting
---

If you are having issues, it's most likely because of some conflict.  This plugin extends the Search-UpdateGrid route, extends the base.js decorator of the product model and also a handful of template files.  I'd start there.  	Otherwise feel free to create an issue.
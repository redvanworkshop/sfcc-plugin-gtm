![RVW Logo](https://red-van-workshop.s3.us-east-1.amazonaws.com/logo.png "RVW Logo")

SFCC Google Tag Manager Plugin
---

An easy to use Google Tag Manager plugin for Salesforce Commerce Cloud, specifically SFRA.  This plugin is almost entirely plug and play.

Installation
---
- Download this repo and add it to your project
- Add sfcc-plugin-gtm cartridge to your site path in Business Manager
- Import the metadata found in the metadata folder named `gtm_metadata.xml`
- Enable GTM and add GTM ID in Business Manager Custom Preferences

Note: There is also file named GTM-Container.json in the metadata folder that is a starting template for your GTM container if you need one. 


Troubleshooting
---

If you are having issues, it's most likely because of some conflict.  This plugin extends the Search-UpdateGrid route, extends the base.js decorator of the product model and also a handful of template files.  I'd start there.  	Otherwise feel free to create an issue.
